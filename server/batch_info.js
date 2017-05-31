/**
 * Created by aether on 4/30/17.
 */

module.exports = function(db) {
    let module = {};

    module.getBatchInfo = function(req, res) {
        db.any("SELECT * FROM batch ORDER BY date_added")
            .then(batches => {
                if (batches) {
                    res.send(batches);
                }
                else { throw [404, "No batches in database"] }
            })
            .catch(err => {
                let response;
                if (err.length === 2) {
                    response = {client: err[1]}
                }
                else {
                    response = {client: "Unknown error occurred in retrieving batch info", server: err};
                }
                res.status(404).send(response)
            });
    };

    return module;
};
