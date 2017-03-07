module.exports = function(fs) {
    var module = {}

    // Author: Matthew
    // Purpose: Pull the next image from the list of sample pictures
    // Actions: 
    //      - get the index from the URL query
    //      - find the image that matches that index
    // Outputs: Image file of next image
    module.get_img = function (req, res) {
        var index = req.query.index;
        //var match_array = new RegExp('\/images\/(.*+?)', 'g').exec(url);
        //res.send(match_array);
        fs.readdir('./sample_pics/', function(err, items) {
            res.sendFile(dir + 'sample_pics/' + items[index]);
        });
    }

    return module;
};
