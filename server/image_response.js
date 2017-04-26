const fs = require('fs');

module.exports = function(db) {
    let module = {};

    // Author: Matthew
    // Purpose: Pull the next image from the list of sample pictures
    // Actions:
    //      - get the index from the URL query
    //      - find the image that matches that index
    // Outputs: Image file of next image
    module.get_img = function (req, res) {
        let index = req.query.index;
        //var match_array = new RegExp('\/images\/(.*+?)', 'g').exec(url);
        //res.send(match_array);
        fs.readdir('./cell_images/', function(err, items) {
            res.sendFile(dir + 'cell_images/' + items[index - 1]);
        });
    };


    module.get_batch_status = function (req, res) {
        let batchID = req.query.id;
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
                // return db.any("SELECT * FROM annotation WHERE username = $1" +
                //     "AND feature = $2 " +
                //     "AND annotation.imageid IN (SELECT images.id FROM images WHERE $3 = ANY(images.batches))",
                //     [user, feature, data.id])
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
                console.log(id_count);
                let id_max = id_count[Object.keys(id_count).reduce(function(a, b){ return id_count[a] > id_count[b] ? a : b })];
                let id_min = id_count[Object.keys(id_count).reduce(function(a, b){ return id_count[a] < id_count[b] ? a : b })];
                console.log(id_max + " " + id_min);
                if (!(id_max === id_min) && !(id_max - id_min === 1)){
                    console.log(id_max - id_min);
                    // in the unlikely case...
                    throw [500, "Critical DB error, entries are not properly sequential for user, batch, and structure"]
                }
                // start the annotation over
                console.log(payload);
                if (id_max === id_min) {
                    for (let i = 0; i < payload.length; i++) {
                        payload[i].status = 0;
                    }
                }
                else {
                    // TODO refactor this because the dictionary component isn't functioning for normal iterations
                    for (let i = 0; i < payload.length; i++) {
                        if (id_count[i] === id_max)
                            payload[i].status = 1;
                        else payload[i].status = 0;
                    }
                }
                console.log(payload);
                res.status(200).send("OK");
            })
    };

    return module;
};

