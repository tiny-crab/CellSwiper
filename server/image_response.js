module.exports = {
    get_img: function (req, res) {
        var fs = require('fs');
        var index = req.query.index;
        //var match_array = new RegExp('\/images\/(.*+?)', 'g').exec(url);
        //res.send(match_array);
        fs.readdir('./sample_pics/', function(err, items) {
            res.sendFile(dir + 'sample_pics/' + items[index]);
        });
    }
};
