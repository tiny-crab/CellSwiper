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

        // --- Hebrews 8:7-8 ---
        // For if there had been nothing wrong with that first promise, no place would have
        // been sought for another. But god found fault with the people and said:
        // "The days are coming, declares the Lord, when I will make a
        new Promise( // with the people of Israel and with the people of Judah."
            function(resolve, reject) {
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
            let promise_list = [];
            for (let img of img_list) {
                let hash;
                console.log(img);
                promise_list.push(phash(img, true)
                    .then(hash => {
                        console.log("Image hashed: " + hash);
                        if (hash === "0") {
                            console.log("Bad hash");
                            // throw [400, "Could not hash image " + path.basename(img)]
                            // TODO: Let user know which images couldn't be added
                            //      This seems to be because of transparency in .png files, not sure exactly though
                            return 0;
                        }
                        return db.any("SELECT id FROM images WHERE hash = $1", [hash])
                            .then(data => {
                                if (data.length === 0) {
                                    return hash;
                                }
                                else if (data.length > 1) {
                                    throw [500, "Multiple image entries with same hash detected in database, please " +
                                    "contact an administrator for remediation"]
                                }
                                else {
                                    // TODO: replace with adding directory to existing entry
                                    // throw [500, "Hash already exists"]
                                    return db.none("UPDATE images SET batches = array_append(batches, $1) WHERE " +
                                        "id = $2", [batchID, data[0].id])
                                        .catch(err => {throw [500, "Couldn't update batches in existing image entry"]})
                                }
                            })
                            .then(record => {
                                // item was hashed and we want to insert it
                                if (record) {
                                   return record
                                }
                                else return 0
                            })
                            .catch(err => {throw err})
                    })
                    // this should technically be possible since I'm returning a promise here
                    .then(hash => {
                        if (hash) {
                            let entries = [batch_path, hash, [batchID]];
                            return db.none("INSERT INTO images(directory, hash, batches) VALUES ($1, $2, $3)", entries)
                                .then(() => {
                                    // copy into batch directory
                                    let img_path = path.join(batch_path, hash + path.extname(img));
                                    fs.createReadStream(img).pipe(fs.createWriteStream(img_path)).on('error', () => {
                                        throw [500, "Couldn't copy image file into batch path"]
                                    });
                                })
                                .catch(err => {
                                    console.log(err);
                                    throw [500, "Couldn't add new image to database"]
                                });
                        }
                    })
                    .catch(err => {
                        if (err.length !== 2) {
                            console.log(err);
                        }
                        else throw err;
                    }))
            }
            return Promise.all(promise_list);
        })
        // if no errors by now, everything went okay
        .then(() => {throw [400, "Directory successfully added"]})
        // Catch any errors, will be of the form [HTTP_STATUS, ERR_MSG}
        .catch((err) => {
            // TODO: Add cleanup function that deletes empty directories and clears the batch out of the database
            if (err.length !== 2) {
                console.log(err)
            }
            else res.status(err[0]).send(err[1])
        });
    };


    return module;
};
