var express = require('express');
var pg = require('pg-promise')();
var fs = require('fs');
var app = express();
var info = require('./serverinfo.json');
var images = require('./server/image_response.js');
var bodyparser = require('body-parser');
var db = pg({host: info.db_host, port: info.db_port, database: info.db_name, user: info.db_user, password: info.db_pass});
var port = info.server_port;
var dir = info.parent_dir;
global.dir = dir;

app.use(express.static('source'))
// for getting post parameters in req.body
app.use(bodyparser.urlencoded({extended: false}));
app.use(bodyparser.json());

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

// Evan stuff
app.get('/export', function(req, res) {
	// ensure that the tmp directory exists
	fs.mkdir('/tmp/csv', (err) => {
		if (!err) {
			// directory just created, set permissions
			fs.chmodSync('/tmp/csv', '777', (err) => {
				res.send("Error: please try again");
			});
		}
		db.none(`copy annotation to '/tmp/csv/export.csv' DELIMITER ',' CSV HEADER`).then(() => {
			res.download(`/tmp/csv/export.csv`, 'export.csv', (err) => {
				if (err) {
					res.send("Error downloading: Please try again");
				}
			});
		}).catch((err) => {
			// should only happen when tmp gets wiped immediately after creating the csv folder
			res.send("Error writing: Please try again");
		});
	});
});

app.post('/annotate', function(req, res) {
	var data = ['imageid', 'user', 'annotation', 'feature'].map(attr => req.body[attr]);
	// if any are not included
	if (data.some(a => a === undefined)) {
		res.send("Error: Invalid data format");
		return;
	}
	db.none("insert into annotation(imageid, username, annotation, feature) values($1, $2, $3, $4)", data)
	.then(() => res.send("Annotation added"))
	.catch(err => {
		res.send("Annotation failed");
		console.log(err);
	});
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
