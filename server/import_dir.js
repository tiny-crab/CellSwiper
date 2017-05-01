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
    // Parameters:
    //      batch_dir: (string) server path to images to add to batch
    //      recursive: (boolean) flag to search for images recursively
    //      batch_name: (string) name [preferably unique] for the batch
    // Output JSON:
    //      result: (string) function result
    //          PASS: all OK
    //          ERROR: errors occurred with some or all images, but batch entered successfully
    //          FAIL: batch not created successfully
    //      err_msg: (string) error message associated with failure
    //      img_errs: (list) image error information
    //          image: (string) image basename
    //          batch_name: (string) associated batch name
    //          err: (string) associated error message
    module.add_batch = function(req, res) {
        let img_list = [];
        const batch_dir = req.query.batch_dir;
        const recursive = req.query.recursive;
        const batch_name = req.query.batch_name;
        const imgExts = new Set(['.jpg', '.png']);
        let batchID, batch_path;
        let return_payload = {result: "", err_msg: "", img_errs: []};

        // --- Hebrews 8:7-8 ---
        // For if there had been nothing wrong with that first promise, no place would have
        // been sought for another. But god found fault with the people and said:
        // "The days are coming, declares the Lord, when I will make a
        new Promise( // with the people of Israel and with the people of Judah."
            function(resolve, reject) {
            // check if valid directory
            fs.stat(batch_dir, (err, stats) => {
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
            if (recursive === "true") {
                return new Promise((resolve, reject) => {
                    let walker = walk.walk(batch_dir);

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
                            reject([400, "No images found in this directory or its children"])
                        }
                        else resolve();
                    })
                });
            }
            // only search in current directory
            else {
                return new Promise((resolve, reject) => {
                    fs.readdir(batch_dir, (err, files) => {
                        if (err) {
                            console.log(`Error getting files from ${batch_dir}`, err);
                            reject([400, "Error getting files, perhaps a read permissions error?"]);
                        }
                        for (let f of files) {
                            // loop through all files
                            if (imgExts.has(path.extname(f)))
                                img_list.push(path.join(batch_dir, path.basename(f)))
                        }
                        if (img_list.length === 0) {
                            reject([400, "No images found in this directory"]);
                        }
                        else resolve();
                    });
                });
            }
        })
        // create batch entry in DB
        .then(() => {
                // should return the promise associated with the DB call
                db.one("INSERT INTO batches(original_dir, batch_name) VALUES ($1, $2) RETURNING id", [batch_dir, batch_name])
        })
        // first, create folder for the batch
        .then((query_data) => {
            batchID = query_data.id;
            if (data_dir) {
                batch_path = path.join(data_dir, batchID.toString());
            }
            else throw [500, "Server data directory not configured properly"];
            return new Promise((resolve, reject) => {
                fs.mkdirSync(batch_path);
                resolve()
            }).catch(() => {
                // remove reference so later error catching doesn't try to remove nonexistent folder
                batch_path = undefined;
                throw [500, "Couldn't create new batch folder in file system"]
            });
        })
        // add image to database
        .then(() => {
            let promise_list = [];
            console.log("Starting hashing");
            for (let img of img_list) {
                promise_list.push(
                    phash(img, true)
                    .then(hash => {
                        if (hash === "0") {
                            return_payload.img_errs.push({
                                image: path.basename(img),
                                batch_name: batch_name,
                                err: "Unhashable image"
                            });
                            return_payload.result = "ERROR";
                            return_payload.err_msg = "Some images could not be processed correctly";
                            return 0;
                        }
                        return db.any("SELECT id FROM images WHERE hash = $1", [hash])
                            .then(data => {
                                if (data.length === 0) {
                                    // hash not present in the DB, so we need to add it
                                    return hash;
                                }
                                else if (data.length > 1) {
                                    // this shouldn't happen, but just in case
                                    throw [500, "Multiple image entries with same hash detected in database, please " +
                                    "contact an administrator for remediation.\nHash in question:" + hash]
                                }
                                else {
                                    // add the batchID to the image that already exists with that hash
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
                            let extension = path.extname(img);
                            let entries = [batch_path, hash, [batchID], extension];
                            return db.none("INSERT INTO images(directory, hash, batches, extension) " +
                                "VALUES ($1, $2, $3, $4)", entries)
                                .then(() => {
                                    // copy into batch directory
                                    let img_path = path.join(batch_path, hash + extension);
                                    return new Promise((resolve, reject) => {
                                        fs.createReadStream(img).pipe(fs.createWriteStream(img_path)).on('error', () => {
                                            reject([500, "Couldn't copy image file into batch path"]);
                                        });
                                        resolve();
                                    });
                                })
                                .catch(err => {
                                    if (err.length !== 2) {
                                        throw [600, "Couldn't add new image to database"]
                                    }
                                    else throw err
                                });
                        }
                    })
                )
            }
            return Promise.all(promise_list);
        })
        // if no errors by now, everything went okay
        .then(() => {
            if (return_payload.result !== "ERROR") {
                return_payload.result = "PASS";
            }
            // check if folder is empty (i.e. all images in database already)
            //      if so, delete it
            try {
                let file_list = fs.readdirSync(batch_path);
                if (file_list.length === 0) {
                    fs.rmdirSync(batch_path)
                }
                else {
                    // downsample batch
                    module.downsize_dir(batch_path);
                }
            } catch (err) {
                console.log(err);
            }
            res.status(200).send(return_payload);
        })
        // Catch any errors, will be of the form [HTTP_STATUS, ERR_MSG]
        .catch((err) => {
            console.log(err);

            // Transaction cleanup
            //   if batchID is initialized we need to proceed with removal
            if (batchID) {
                // wrap transaction cleanup in transaction so all operated on at once
                db.tx(t => {

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

                    // start in reverse, remove batchID from all image entries
                    return t.none("UPDATE images SET batches = array_remove(batches, $1)", batchID)
                        // remove all images with no batchIDs
                        .then(() => { return t.none("DELETE FROM images WHERE batches = '{}'")})
                        // remove batch entry from batches table
                        .then(() => { return t.none("DELETE FROM batches WHERE id = $1", batchID)})
                        .catch(err => { console.log(err)});

                })
                .catch(err => { console.log("Transaction cleanup error: " + err);});
            }

            if (err.length === 2) {
                // okay to override previously set result if it fails here
                return_payload.result = "FAIL";
                return_payload.err_msg = err[1];
                res.status(err[0]).send(return_payload);
            }
            else {
                // nothing here yet
            }
        });
    };


    return module;
};
