const phash = require('phash-image');
const fs = require('fs');
const path = require('path');

// sample PNGs acquired from:
//      http://www.schaik.com/pngsuite/
//      http://www.fnordware.com/superpng/samples.html
// note: images with 'x' preface are intentionally corrupted

let dir = './pngtest/'
fs.readdir(dir, (err, files) => {
    if (err) {
        console.log(err)
    }
    for (let f of files) {
        phash(path.join(dir, f), true, (err, hash) => {
            if (err) {
                console.log(err);
            }
            else console.log("File: " + f + "\tHash: " + hash);
        });
    }
});

