var express = require('express');
var pg = require('pg-promise')();
var fs = require('fs');
var app = express();
var info = require('./serverinfo.json');
var images = require('./server/image_response.js');
var db = pg({host: info.db_host, port: info.db_port, database: info.db_name, user: info.db_user, password: info.db_pass});
var port = info.server_port
var dir = info.parent_dir
global.dir = dir

//app.get('//:id', function(req,res) {
app.get('/dbtest', function(req,res) {
	db.any('select * from annotation', [true]).then((data) => {
		res.send(data);
	}).catch(err => {
		res.send("No post found");
	});
});

app.get('/', function(req, res) {
	res.sendFile(dir + 'sample.html');
});

app.get('/start', function(req, res) {
    res.sendFile(dir + 'source/start_page.html');
});

app.get('/scripts/start_annotation.js', function(req, res) {
    res.sendFile(dir + 'scripts/start_annotation.js');
});

app.get('/annotation', function(req, res) {
	var imgID = req.query.index;
	res.sendFile(dir + 'source/annotation.html');
});

app.get('/scripts/annotation.js', function(req, res) {
    res.sendFile(dir + 'scripts/annotation.js');
});

app.get('/images', images.get_img);

app.get('/sample_script.js', function(req, res) {
	res.sendFile(dir + 'sample_script.js');
});

app.get('/confirm', function(req, res) {
    res.send("Confirmed request");
	//res.send(req.url);
});

//app.get('/confirm', images.get_img);

app.get('/deny', function(req, res) {
	res.send("Denied request");
});

var server = app.listen(port, () => {
	console.log(`listening on port ${port}`);
}).on('error', (err) => {
	if (err.code == "EADDRINUSE") {
		console.log(`Port ${port} already in use`);
	}
	else {
		throw err;
	}
});
