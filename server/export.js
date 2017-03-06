// Author: Evan
// Purpose: (currently) Export entire database
// Parameters: (currently) None
// Actions: TODO - Evan document
// Outputs: CSV to download
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

