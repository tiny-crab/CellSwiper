/**
 * Created by aether on 4/30/17.
 */

module.exports = function(db) {
    let module = {};

    module.getBatchInfo = function(req, res) {
        db.any("SELECT * FROM batches ORDER BY date_added")
            .then(batches => {
                if (batches) {
                    res.send(batches);
                }
                else { throw [500, "No batches in database"] }
            })
            .catch(err => {
                if (err.length === 2) {
                   res.status(err[0]).send(err[1])
                }
                else {
                    console.log(err);
                    res.status(500).send("Unknown error occurred, check server logs")
                }
            });
    };

    return module;
};
