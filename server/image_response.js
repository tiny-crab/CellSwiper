const fs = require('fs');
const path = require('path');

module.exports = function(db, image_dir) {
    let module = {};

    // Author: Matthew
    // Purpose: Pull the next image from the list of sample pictures
    // Actions:
    //      - get the id from the URL query
    //      - find the image that matches that id
    // Outputs: Image file of next image
    module.getImage = function (req, res) {
        let id = req.query.id;
        let large = req.query.large;
        if (!id) {
            res.status(404).send({client: "No image ID given"});
            return;
        }
        db.one("SELECT * FROM images WHERE id=$1", id)
            .then((image) => {
                // image found
                let batchPath = path.join(image_dir, image.batches[0].toString());
                let imagePath;
                // helper functions
                let checker = (imgPath, errorFunction) => {
                    fs.access(imgPath, fs.constants.F_OK, (err) => {
                        if (err) {
                            errorFunction(err);
                        }
                        else {
                            res.sendFile(imgPath);
                        }
                    });
                };
                let noImage = (err) => {
                    res.status(404).send({client: `Could not access image ${image.hash} in file system`,
                        server: err});
                    console.log(err)
                };
                let noDownsample = (err) => {
                    console.log(err);
                    console.log("  Attempting to access fullsize image");
                    // change image path
                    imagePath = path.join(batchPath, image.hash + image.extension);
                    checker(imagePath, noImage);
                };

                // return the file
                if (large) {
                    imagePath = path.join(batchPath, image.hash + image.extension);
                    checker(imagePath, noImage);
                }
                // get downsampled image instead (will always be .png)
                else {
                    imagePath = path.join(path.join(batchPath, 'ds/'), image.hash + ".png");
                    checker(imagePath, noDownsample);
                }
            })
            .catch((err) => {
                // most likely image doesn't exist in DB
                res.status(404).send({client: `Image of id "${id}" not found in database`, server: err});
                console.log(err)
            });
    };


    module.getBatchStatus = function (req, res) {
        let batchID = req.query.batchid;
        let user = req.query.user;
        let feature = req.query.feature;
        if (!batchID || !user || !feature) {
            res.status(400).send({client: "Invalid query parameters for batch status"});
            return;
        }
        let payload = [];

        db.one("SELECT * FROM batches WHERE id = $1", batchID)
            .then(data => {
                if (!data) {
                    reject(["Batch ID not found"])
                }
                // query db about annotations
                return db.any("SELECT id FROM images WHERE $1 = ANY(images.batches)", batchID)
            })
            .then(images => {
                // add images to payload
                payload = images;
                // sort by ID
                payload.sort((a, b) => {
                    let x = a.id; let y = b.id;
                    return ((x < y) ? -1 : ((x > y) ? 1 : 0));
                });
                let ids = payload.map(x => { return x.id });
                // get annotations with this user, this feature,
                // and where the image ID is in the list of images for this batch
                return db.any("SELECT * FROM annotation WHERE username = $1" +
                    "AND feature = $2 " +
                    "AND annotation.imageid IN ($3:csv)",
                    [user, feature, ids])
                    .catch(err => {
                        throw [`Error retrieving annotations for images with IDs ${ids}`, err];
                    })
            })
            .then(annotations => {
                // count annotations in list to see where to pick up
                let id_count = {};
                for (let item of payload) {
                    id_count[item.id] = 0
                }
                for (let item of annotations) {
                    id_count[item.imageid]++
                }
                let id_max = id_count[Object.keys(id_count).reduce(function(a, b){ return id_count[a] > id_count[b] ? a : b })];
                let id_min = id_count[Object.keys(id_count).reduce(function(a, b){ return id_count[a] < id_count[b] ? a : b })];
                if (!(id_max === id_min) && !(id_max - id_min === 1)){
                    // in the unlikely case...
                    throw ["Critical DB error, entries are not properly sequential for user, batch, and feature"]
                }
                // start the annotation over
                if (id_max === id_min) {
                    for (let i = 0; i < payload.length; i++) {
                        payload[i].status = 0;
                    }
                }
                else {
                    // annotation only part-way through set, find which ones to finish
                    for (let item of payload) {
                        item.status = (id_count[item.id] === id_max ? 1 : 0)
                    }
                }
                res.status(200).send(payload);
            })
            .catch(err => {
                console.log(err);
                let response;
                if (err.length === 2) {
                    response = {client: err[0], server: err[1]}
                }
                else if (err.length === 1) {
                    response = {client: err}
                }
                else {
                    response = {client: "An unknown error occurred while fetching batch status", server: err}
                }
                // otherwise fail anyway
                res.status(404).send(response);
            })
    };

    return module;
};

