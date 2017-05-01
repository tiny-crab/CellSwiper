const fs = require('fs');

module.exports = function(db) {
    let module = {};

    // Author: Matthew
    // Purpose: Pull the next image from the list of sample pictures
    // Actions:
    //      - get the id from the URL query
    //      - find the image that matches that id
    // Outputs: Image file of next image
    module.get_img = function (req, res) {
        let id = req.query.id;
        let large = req.query.large;
        //var match_array = new RegExp('\/images\/(.*+?)', 'g').exec(url);
        let img_dir = data_dir;
        if (large) {
            fs.readdir(img_dir, function(err, items) {
                res.sendFile(img_dir + items[id - 1]);
            });
        }
        else {
            // send smaller files
            fs.readdir(img_dir + "ds/", function (err, items) {
                res.sendFile(img_dir + "ds/" + items[id - 1]);
            });
        }
    };


    module.get_batch_status = function (req, res) {
        let batchID = req.query.batchid;
        let user = req.query.user;
        let feature = req.query.feature;
        let payload = [];

        db.one("SELECT * FROM batches WHERE id = $1", batchID)
            .then(data => {
                if (!data) {
                    reject([400, "Batch ID not found"])
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
                    .catch(error => {
                        console.log(error)
                    })
            })
            .then(annotations => {
                // count annotations in list to see where to pick up
                let id_count = {};
                for (item of payload) {
                    id_count[item.id] = 0
                }
                for (item of annotations) {
                    id_count[item.imageid]++
                }
                let id_max = id_count[Object.keys(id_count).reduce(function(a, b){ return id_count[a] > id_count[b] ? a : b })];
                let id_min = id_count[Object.keys(id_count).reduce(function(a, b){ return id_count[a] < id_count[b] ? a : b })];
                if (!(id_max === id_min) && !(id_max - id_min === 1)){
                    // in the unlikely case...
                    throw [500, "Critical DB error, entries are not properly sequential for user, batch, and feature"]
                }
                // start the annotation over
                if (id_max === id_min) {
                    for (let i = 0; i < payload.length; i++) {
                        payload[i].status = 0;
                    }
                }
                else {
                    // annotation only part-way through set, find which ones to finish
                    for (item of payload) {
                        item.status = (id_count[item.id] === id_max ? 1 : 0)
                    }
                }
                res.status(200).send(payload);
            })
            .catch(err => {
                console.log(err);
                if (err.length === 2) {
                    res.status(err[0]).send(err[1])
                }
            })
    };

    return module;
};

