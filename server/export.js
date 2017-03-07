module.exports = function(fs, db) {
    var module = {};

    // Author: Evan
    // Purpose: (currently) Export entire database
    // Parameters: (currently) None
    // Outputs: CSV to download
    module.export_csv = function(req, res) {
        // whole process done as a single promise
        new Promise(function(resolve, reject) {
            // ensure that the tmp directory exists
            fs.mkdir('/tmp/csv', (err) => {
                // create csv file, set write permissions for all
                // first if it was just created
                if (!err) {
                    fs.chmod('/tmp/csv', '777', (err) => {
                        if (err) {
                            // this should not happen
                            reject(["Error chaning permissions: Please try again", err]);
                        }
                        resolve();
                    });
                }
                else {
                    resolve();
                }
            });
        }) // run the command to output the table to a file
        // replace 'annotation' with a select query to get certain rows instead of the whole thing
        .then(db.none(`copy annotation to '/tmp/csv/export.csv' DELIMITER ',' CSV HEADER`))
        .then(function() {
            // download file to client
            res.download(`/tmp/csv/export.csv`, 'export.csv', (err) => {
                if (err) {
                    throw ["Error downloading: Please try again\n", err]
                }
            });
        })
        .catch(function(err) {
            // runs on reject() or throw, meant to catch errors
            res.send(err[0] + err[1])
        });
    }
    return module;
};