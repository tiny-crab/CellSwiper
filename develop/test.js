var express = require('express');
var pg = require('pg-promise')();
var app = express();
var db = pg({host: 'localhost', port: 5432, database: 'develop', user:'evan', password:'pizza'});
var port = 3000;

//app.get('//:id', function(req,res) {
app.get('/dbtest', function(req,res) {
	db.any('select * from annotation', [true]).then((data) => {
		res.send(data);
	}).catch(err => {
		res.send("No post found");
	});
});

app.get('/', function(req, res) {
	res.sendFile('/home/cellswiper/develop/sample.html');
});

app.get('/sample_script.js', function(req, res) {
	res.sendFile('/home/cellswiper/develop/sample_script.js');
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
