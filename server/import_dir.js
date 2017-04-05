const fs = require('fs');
const walk = require('walk');
const path = require('path');
const sharp = require('sharp');

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
                if (err.code === "ENOENT") {
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
            if (recursive === True) {
                let walker = walk.walk(dir);

                walker.on("file", (root, fileStats, next) => {
                    // add to list if valid image file
                    if (imgExts.has(path.extname(fileStats.name))) {
                        img_list.add(path.join(root, fileStats.name));
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
                            img_list.add(path.join(dir, path.basename(f)))
                    }
                });
                if (img_list.length === 0) {
                    throw [400, "No images found in this directory"]
                }
            }
        })
        // create batch entry in DB
        .then(() => {
            db.none("INSERT INTO batches(original_dir) VALUES($1)", [dir])
                .catch(err => {
                    throw [500, "Couldn't create new batch entry in database"]
                });
        })
        // add image to database
        .then(() => {

        })
        // Catch any errors, will be of the form [HTTP_STATUS, ERR_MSG}
        .catch((err) => {
            res.status(err[0]).send(err[1])
        });
    };


    return module;
};
