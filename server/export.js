const fs = require('fs');
const path = require('path');
const json2csv = require('json2csv');

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
                options.push('batch_id = ($3)');
            }
            if (req.query.feature !== undefined) {
                options.push('feature_id = ($4)');
            }
            if (options.length > 0) {
                select += " WHERE " + options.join(" AND ");
            }
            return db.any(select, [req.query.name, req.query.date, req.query.batch, req.query.feature])
                .catch(err => { throw ["Error getting export data", err] })
        })
        .then(function(data) {
            let expanded_data = data.map(row => {
                // parse json and add it to the object as rows
                let new_row = Object.assign(row, row.data);
                delete new_row.data;
                return new_row;
            });
            let fileName = `annotation_export_${new Date().toDateString().replace(/\s+/g, '_')}.csv`;
            let fileName_random = fileName.replace('.', `_${Math.random().toString(36).substring(10)}.`);
            let fullPath = path.join("/tmp", "csv", fileName_random)
            console.log(expanded_data);
            fs.writeFile(fullPath, json2csv({data: expanded_data}), err => {
                if (err) {
                    res.status(404).send({client: "Error: no export file created"});
                }
                else {
                    res.status(200).download(fullPath, fileName);
                }
            });
        })
        .catch(function(err) {
            // runs on reject() or throw, meant to catch errors
            console.log(err);
            res.status(404).send({client: "Unknown error occurred in exporting", server: err})
        });
    };

    module.send_users = function(req, res) {
        db.any('SELECT username FROM users', [true]).then((data) => {
            users = [];
            data.forEach(item => {
                users.push(item.username);
            });
            res.send(users);
        }).catch(err => {
            res.status(404).send({client: "Unknown error occurred in finding user", server: err}); // no users
        });
    };

    return module;
};