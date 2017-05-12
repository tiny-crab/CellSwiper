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
            fileName = `annotation_export_${new Date().toDateString().replace(/\s+/g, '_')}_${Math.random().toString(36).substring(10)}.csv`;
            return db.none(`COPY (${select}) TO '${fileName}' DELIMITER ',' CSV HEADER`, [req.query.name, req.query.date, req.query.batch, req.query.feature])
                .then(() => Promise.resolve(fileName))
                .catch(err => { throw ["Error writing csv on server", err] })
        })
        .then(function(file) {
            // download file to client
            if (!fs.existsSync(file)){
                res.status(404).send({client: "Error: no export file created"})
            }
            else {
                res.status(200).send({export: file});
            }
        })
        .catch(function(err) {
            // runs on reject() or throw, meant to catch errors
            console.log(err);
            res.status(404).sent({client: "Unknown error occurred in exporting", server: err})
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