const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

module.exports = function(db) {
    let module = {};

    module.downsize_dir = function (dir) {
        let ds_path = path.join(dir, 'ds');
        let downsampleSize = 300;

        fs.mkdir(ds_path, (err) => {
            if (err) {
                console.log(`Error creating directory ${ds_path}`, err);
                return;
            }
            fs.readdir(dir, (err, files) => {
                if (err) {
                    console.log(`Error getting files from ${dir}`, err);
                    return;
                }
                // supported image extensions
                const imgExts = new Set(['.jpg', '.png', '.bmp', '.tif']);
                for (let f of files) {
                    // loop through all files
                    if (!imgExts.has(path.extname(f)))
                        continue;
                    let fName = path.join(ds_path, path.basename(f)).replace(/.\w+$/, ".png");
                    sharp(path.join(dir, f)).resize(downsampleSize).png().toFile(fName, (err) => {
                        if (err) {
                            console.log(`Error writing file ${fName}`, err);
                        }
                    });
                }
            });
        });
    }

    return module;
};
