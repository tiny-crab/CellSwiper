let express = require('express');
let pg = require('pg-promise')();
let fs = require('fs');
let app = express();
let info = require('./serverinfo.json');
let bodyparser = require('body-parser');
let db = pg({host: info.db_host, port: info.db_port, database: info.db_name, user: info.db_user, password: info.db_pass});
let port = info.server_port;
let dir = info.parent_dir;
global.dir = dir;
let images = require('./server/image_response.js');
let exports = require('./server/export.js')(db, info.data_dir);
let imports = require('./server/import_dir')();

// serv static pages
app.use('/pages', express.static('pages'));
app.use('/styles', express.static('styles'));
app.use('/scripts', express.static('scripts'));

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
    res.sendFile(dir + 'pages/start_page.html');
});

app.get('/home', function(req, res) {
    res.sendFile(dir + 'pages/home.html');
});

app.get('/annotation', function(req, res) {
	let imgID = req.query.index;
	res.sendFile(dir + 'pages/annotation.html');
});

app.get('/complete', function(req, res) {
    res.sendFile(dir + 'pages/export.html');
});

app.get('/images', images.get_img);

app.get('/export', exports.export_csv);

app.get('/export-users', exports.send_users);

app.get('/sample_script.js', function(req, res) {
	res.sendFile(dir + 'sample_script.js');
});

app.get('/confirm', function(req, res) {
    res.send("Confirmed request");
	//res.send(req.url);
});

app.get('/deny', function(req, res) {
	res.send("Denied request");
});

app.post('/insert_name', function(req, res) {
    let name = [req.body.name];
    db.none("INSERT INTO users (username) VALUES ($1)", name)
        .then( () => {
            res.sendStatus(200); // status OK
        })
        .catch( err => {
            res.sendStatus(200); // username probably already used
        });
});

app.post('/annotate', function(req, res) {
	let data = ['imageid', 'user', 'annotation', 'feature'].map(attr => req.body[attr]);
	// if any are not included
	if (data.some(a => a === undefined)) {
		res.status(400).send("Error: Invalid data format");
		return;
	}
	db.none("INSERT INTO annotation(imageid, username, annotation, feature) VALUES($1, $2, $3, $4)", data)
	.then(() => res.send("Annotation added"))
	.catch(err => {
		res.status(500).send("Error: Annotation failed");
		console.log(err);
	});
});

let server = app.listen(port, () => {
	console.log(`listening on port ${port}`);
}).on('error', (err) => {
	if (err.code === "EADDRINUSE") {
		console.log(`Port ${port} already in use`);
	}
	else {
		throw err;
	}
});
