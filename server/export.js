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
                            reject(["Error changing permissions: Please try again", err]);
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
        .then(() => {
            let select = "SELECT * FROM annotation";
            console.log(req.query.before);
            if (req.query.name !== undefined && req.query.date !== undefined) {
                select += " WHERE username = ($1) AND date_added " + (req.query.before == "1" ? "<=" : ">=") + " ($2)";
            }
            else if (req.query.name !== undefined) {
                select += " WHERE username = ($1)";
            }
            else if (req.query.date !== undefined) {
                select += " WHERE date_added " + (req.query.before == "1" ? "<=" : ">=") + " ($2)";
            }
            return db.none(`COPY (${select}) TO '/tmp/csv/export.csv' DELIMITER ',' CSV HEADER`, [req.query.name, req.query.date])
        })
        .then(function() {
            // download file to client
            if (!fs.existsSync('/tmp/csv/export.csv')){
                // fs.writeFile('/tmp/csv/export.csv', 'content')
                res.status(500).send("Error: no export file created")
            }
            else {
                res.download(`/tmp/csv/export.csv`, 'export.csv', (err) => {
                    if (err) {
                        throw ["Error downloading: Please try again\n", err]
                    }
                });
            }
        })
        .catch(function(err) {
            // runs on reject() or throw, meant to catch errors
            res.send(err[0] + err[1])
        });
    };
    return module;
};