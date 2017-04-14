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
                const imgExts = new Set(['.jpg', '.png']);
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
    module.add_batch = function(req, res) {
        let img_list = [];
        const img_dir = req.query.dir;
        const recursive = req.query.recursive;
        const batch_name = req.query.batch_name;
        const imgExts = new Set(['.jpg', '.png']);
        let batchID, batch_path;
        let return_payload = {};

        // --- Hebrews 8:7-8 ---
        // For if there had been nothing wrong with that first promise, no place would have
        // been sought for another. But god found fault with the people and said:
        // "The days are coming, declares the Lord, when I will make a
        new Promise( // with the people of Israel and with the people of Judah."
            function(resolve, reject) {
            // check if valid directory
            fs.stat(img_dir, (err, stats) => {
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
                let walker = walk.walk(img_dir);

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
                fs.readdir(img_dir, (err, files) => {
                    if (err) {
                        console.log(`Error getting files from ${img_dir}`, err);
                        throw [400, "Error getting files, perhaps a read permissions error?"]
                    }
                    for (let f of files) {
                        // loop through all files
                        if (imgExts.has(path.extname(f)))
                            img_list.push(path.join(img_dir, path.basename(f)))
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
            return db.one("INSERT INTO batches(original_dir, batch_name) VALUES ($1, $2) RETURNING id", [img_dir, batch_name])
        })
        // first, create folder for the batch
        .then((query_data) => {
            batchID = query_data.id;
            batch_path = path.join(data_dir, batchID.toString());
            // fs.mkdir(batch_path, err => {
            //     if (err) throw [500, "Couldn't create new batch folder in file system"];
            //     else return [batchID, batch_path]
            // })
            try {
                fs.mkdirSync(batch_path);
            } catch (err) {
                // remove reference so later error catching doesn't try to remove nonexistent folder
                batch_path = undefined;
                throw [500, "Couldn't create new batch folder in file system"]
            }
        })
        // add image to database
        .then(() => {
            let promise_list = [];
            for (let img of img_list) {
                console.log(img);
                promise_list.push(
                    phash(img, true)
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
                                        .catch(err => {throw [600, "Couldn't update batches in existing image entry"]})
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
                        // if the has isn't 0
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
                                    throw [600, "Couldn't add new image to database"]
                                });
                        }
                    })
                )
            }
            return Promise.all(promise_list);
        })
        // if no errors by now, everything went okay
        .then(() => {
            // TODO: JSON PACKET OK
            res.status(200).send("All OK");
        })
        // Catch any errors, will be of the form [HTTP_STATUS, ERR_MSG]
        .catch((err) => {
            console.log(err);

            // Transaction cleanup
            //   if batchID is initialized we need to proceed with removal
            if (batchID) {
                // start in reverse, remove batchID from all image entries
                db.none("UPDATE images SET batches = array_remove(batches, $1)", batchID);
                // remove all images with no batchIDs
                db.none("DELETE FROM images WHERE batches = '{}'");
                if (batch_path) {
                    // remove batch folder from file system
                    try {
                        let file_list = fs.readdirSync(batch_path);
                        for (let f of file_list) {
                            fs.unlinkSync(path.join(batch_path, f));
                        }
                        fs.rmdirSync(batch_path);
                    } catch (err) {
                        console.log(err);
                    }
                }
                // remove batch entry from batches table
                db.none("DELETE FROM batches WHERE id = $1", batchID);
            }

            // TODO: Add cleanup function that deletes empty directories and clears the batch out of the database
            if (err.length === 2) {
                res.status(err[0]).send(err[1]);
            }
            else {
                // nothing here yet
            }
        });
    };


    return module;
};
