const fs = require('fs');

module.exports = function(db) {
    let module = {};

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
            let options = [];
            if (req.query.name !== undefined) {
                options.push("username = ($1)");
            }
            if (req.query.date !== undefined) {
                options.push("date_added " + (req.query.before === "1" ? "<=" : ">=") + " ($2)");
            }
            if (req.query.batch !== undefined) {
                options.push('batchid = ($3)');
            }
            if (req.query.feature !== undefined) {
                options.push('feature = ($4)');
            }
            if (options.length > 0) {
                select += " WHERE " + options.join(" AND ");
            }
            return db.none(`COPY (${select}) TO '/tmp/csv/export.csv' DELIMITER ',' CSV HEADER`, [req.query.name, req.query.date, req.query.batch, req.query.feature])
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
                       res.status(500).send("Error downloading: Please try again\n")
                    }
                });
            }
        })
        .catch(function(err) {
            // runs on reject() or throw, meant to catch errors
            console.log(err);
        });
    };

    module.send_users = function(req, res) {
        db.any('select username from users', [true]).then((data) => {
            users = [];
            data.forEach(item => {
                users.push(item.username);
            });
            res.send(users);
        }).catch(err => {
            res.sendStatus(500); // no users
        });
    };

    return module;
};