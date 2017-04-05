module.exports = function(fs) {
    let module = {};

    // Author: Matthew
    // Purpose: Pull the next image from the list of sample pictures
    // Actions:
    //      - get the index from the URL query
    //      - find the image that matches that index
    // Outputs: Image file of next image
    module.get_img = function (req, res) {
        let index = req.query.index;
        //var match_array = new RegExp('\/images\/(.*+?)', 'g').exec(url);
        //res.send(match_array);
        fs.readdir('./cell_images/', function(err, items) {
            res.sendFile(dir + 'cell_images/' + items[index - 1]);
        });
    };

    return module;
};

