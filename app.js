let express = require('express');
let pg = require('pg-promise')();
let fs = require('fs');
let app = express();
let info = require('./serverinfo.json');
let bodyparser = require('body-parser');
let db = pg({host: info.db_host, port: info.db_port, database: info.db_name, user: info.db_user, password: info.db_pass});
let port = info.server_port;
let dir = info.parent_dir;
let images = require('./server/image_response.js')(db);
let exporter = require('./server/export.js')(db);
let importer = require('./server/import_dir.js')(db, info.data_dir);
let batches = require('./server/batch_info')(db);

let exec = require('child_process').exec;

// build the folders.json file
// eventually this shoiuld be run once every couple of minutes
exec(`./watch.sh ${info.data_dir} .`);


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

app.get('/batch-list', function(req, res) {
    res.sendFile(dir + 'pages/batch_list.html');
});

app.get('/home', function(req, res) {
    res.sendFile(dir + 'pages/home.html');
});

app.get('/feature-list', function(req, res) {
	//for the time being (this should be changed to exist in the DB)
    db.any('SELECT DISTINCT feature FROM annotation').then(data => {
        res.json(data.map(f => f.feature));
    }).catch(err => {
        res.json("[]");
    });
});

app.get('/annotation', function(req, res) {
	res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
	res.setHeader("Pragma", "no-cache");
	res.setHeader("Expires", "0");
	res.sendFile(dir + 'pages/annotation.html');
});

app.get('/admin', function(req, res) {
    res.sendFile(dir + 'pages/admin.html');
});

app.get('/complete', function(req, res) {
    res.sendFile(dir + 'pages/export.html');
});

app.get('/images', images.getImage);

app.get('/export', exporter.export_csv);

app.get('/export-users', exporter.send_users);

app.get('/all-batch-info', batches.getBatchInfo);

app.get('/test-add', importer.add_batch);

app.get('/batch-status', images.getBatchStatus);

app.get('/sample_script.js', function(req, res) {
	res.sendFile(dir + 'sample_script.js');
});

app.get('/add-directory', function(req, res) {
    res.sendFile(dir + 'pages/add_directory.html');
});

app.post('/insert-name', function(req, res) {
    let name = [req.body.name];
	if (!/^[\w_-]+$/.test(name)) {
		// invalid name
		res.sendStatus(400);
        return;
	}
    db.none("INSERT INTO users (username) VALUES ($1)", name)
        .then( () => {
            res.sendStatus(200); // status OK
        })
        .catch( err => {
            res.sendStatus(200); // username probably already used
        });
});

app.post('/annotate', function(req, res) {
	let data = ['imageid', 'user', 'annotation', 'feature', 'batchid'].map(attr => req.body[attr]);
	// if any are not included
	if (data.some(a => a === undefined)) {
		res.status(400).send({client: "Error: Invalid data format"});
		return;
	}
	db.none("INSERT INTO annotation(imageid, username, annotation, feature, batchid) VALUES($1, $2, $3, $4, $5)", data)
	.then(() => res.send("Annotation added"))
	.catch(err => {
		res.status(400).send({client: "Error: Annotation failed", server: err});
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
