var express = require('express');
var pg = require('pg-promise')();
var app = express();
var info = require('./serverinfo.json');
var db = pg({host: info.db_host, port: info.db_port, database: info.db_name, user: info.db_user, password: info.db_pass});
var port = info.server_port

//app.get('//:id', function(req,res) {
app.get('/dbtest', function(req,res) {
	db.any('select * from annotation', [true]).then((data) => {
		res.send(data);
	}).catch(err => {
		res.send("No post found");
	});
});

app.get('/', function(req, res) {
	res.sendFile(info.parent_dir + 'sample.html');
});

app.get('/sample_script.js', function(req, res) {
	res.sendFile(info.parent_dir + 'sample_script.js');
});

app.get('/confirm', function(req, res) {
	res.send("Confirmed request");
});

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
