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
            let select = "SELECT annotation.*, concat(images.hash, images.extension) AS image_name FROM annotation INNER JOIN images ON (images.id = annotation.imageid)";
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
            return db.any(select, [req.query.name, req.query.date, req.query.batch, req.query.feature])
                .catch(err => { throw ["Error getting export data", err] })
        })
        .then(function(data) {
            let expanded_data = data.map(row => {
                let new_row = Object.assign(row, row.data);
                delete new_row.data;
                return new_row;
            });
            let fileName = `annotation_export_${new Date().toDateString().replace(/\s+/g, '_')}.csv`;
            let fileName_random = fileName.replace('.', `_${Math.random().toString(36).substring(10)}.`);
            let fullPath = path.join("/tmp", "csv", fileName_random);
            let csv;
            // json2csv throws an error if data is an empty list, so just write an empty csv file if that happens
            try {
                csv = json2csv({data: expanded_data});
            }
            catch (e) {
                csv = "";
            }
            fs.writeFile(fullPath, csv, err => {
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
        db.any('SELECT username FROM users ORDER BY username ASC', [true]).then((data) => {
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