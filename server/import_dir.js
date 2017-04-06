const fs = require('fs');
const walk = require('walk');
const path = require('path');
const sharp = require('sharp');
const phash = require('phash-image');

module.exports = function(db, data_dir) {
    let module = {};

    // Author: Evan
    module.downsize_dir = function (dir) {
        let ds_path = path.join(dir, 'ds');
        let downsampleSize = 300;

        fs.mkdir(ds_path, (err) => {
            if (err) {
                console.log(`Error creating directory ${ds_path}`, err);
                return;
            }
            fs.readdir(dir, (err, files) => {
                if (err) {
                    console.log(`Error getting files from ${dir}`, err);
                    return;
                }
                // supported image extensions
                const imgExts = new Set(['.jpg', '.png', '.bmp', '.tif']);
                for (let f of files) {
                    // loop through all files
                    if (!imgExts.has(path.extname(f)))
                        continue;
                    let fName = path.join(ds_path, path.basename(f)).replace(/.\w+$/, ".png");
                    sharp(path.join(dir, f)).resize(downsampleSize).png().toFile(fName, (err) => {
                        if (err) {
                            console.log(`Error writing file ${fName}`, err);
                        }
                    });
                }
            });
        });
    };

    // Author: Matthew
    module.import_dir = function(req, res) {
        let img_list = [];
        const dir = req.query.dir;
        const recursive = req.query.recursive;
        const imgExts = new Set(['.jpg', '.png', '.bmp', '.tif']);

        // whole process done as a single promise
        new Promise(function(resolve, reject) {
            // check if valid directory
            fs.stat(dir, (err, stats) => {
                if (err && err.code === "ENOENT") {
                    reject([400, "No such directory exists"]);
                }
                else {
                    if (!stats.isDirectory()) {
                        reject([400, "Path specified is not a directory"]);
                    }
                }
            });
            resolve();
        })
        // read directory and compile a list of images
        .then(() => {
            // recursively walk paths
            if (recursive === true) {
                let walker = walk.walk(dir);

                walker.on("file", (root, fileStats, next) => {
                    // add to list if valid image file
                    if (imgExts.has(path.extname(fileStats.name))) {
                        img_list.push(path.join(root, fileStats.name));
                    }
                    next();
                });

                walker.on("error", (root, nodeStatsArray, next) => {
                    console.log(nodeStatsArray.error);
                    next();
                });

                walker.on("end", () => {
                    if (img_list.length === 0) {
                        throw [400, "No images found in this directory or its children"]
                    }
                })
            }
            // only search in current directory
            else {
                fs.readdir(dir, (err, files) => {
                    if (err) {
                        console.log(`Error getting files from ${dir}`, err);
                        throw [400, "Error getting files, perhaps a read permissions error?"]
                    }
                    for (let f of files) {
                        // loop through all files
                        if (imgExts.has(path.extname(f)))
                            img_list.push(path.join(dir, path.basename(f)))
                    }
                    if (img_list.length === 0) {
                        throw [400, "No images found in this directory"]
                    }
                });
            }
        })
        // create batch entry in DB
        .then(() => {
            // should return the promise associated with the DB call
            return db.one("INSERT INTO batches(original_dir) VALUES ($1) RETURNING id", [dir])
        })
        // first, create folder for the batch
        .then((query_data) => {
            let batchID = query_data.id;
            let batch_path = path.join(data_dir, batchID.toString());
            console.log(batch_path);
            // fs.mkdir(batch_path, err => {
            //     if (err) throw [500, "Couldn't create new batch folder in file system"];
            //     else return [batchID, batch_path]
            // })
            fs.mkdirSync(batch_path);
            return [batchID, batch_path]
        })
        // add image to database
        .then(payload => {
            console.log("here");
            let batchID = payload[0];
            let batch_path = payload[1];
            // for (let img_ind in img_list) {
            //     why do I have to do this python is so much better
            //     let img = img_list[img_ind];
                let img = img_list[1];
                let hash;
                console.log(img);
                phash(img, true)
                    .then(hash => {
                        console.log("Image hashed: " + hash);
                        db.any("SELECT imageid FROM image WHERE hash = $1", [hash])
                            .then(data => {
                                if (data.length === 0) {
                                    return hash;
                                }
                                else {
                                    throw [500, "Hash already exists"]
                                }
                            })
                            .catch(err => {throw err})
                    })
                    // this should technically be possible since I'm returning a promise here
                    .then(hash => {
                        // if there's already this image in the DB
                        // if (data.length !== 0) {
                        // }
                        // else {
                            let entries = [batch_path, hash, [batchID]];
                            console.log(entries);
                            db.none("INSERT INTO images(directory, hash, batches) VALUES ($1, $2, $3)")
                                .catch(err => {
                                    console.log(err);
                                    throw [500, "Couldn't add new image to database"]
                                });
                            // copy into batch directory
                            let img_path = path.join(batch_path, hash + path.extname(img));
                            fs.createReadStream(img).pipe(fs.createWriteStream(img_path)).on('error', () => {
                                throw [500, "Couldn't copy image file into batch path"]
                            });
                                // .catch(err => { throw [500, "Couldn't copy image file into batch path"]});
                        // }
                    })
                    .catch(err => {
                        if (err.length !== 2) {
                            console.log(err);
                            throw [500, "Multiple image entries with same hash detected in database, please " +
                            "contact an administrator for remediation"]
                        }
                        else throw err;
                    })
            // }
            // console.log("Images added to database")
        })
        // Catch any errors, will be of the form [HTTP_STATUS, ERR_MSG}
        .catch((err) => {
            if (err.length !== 2) {
                console.log(err)
            }
            else res.status(err[0]).send(err[1])
        });
    };


    return module;
};
