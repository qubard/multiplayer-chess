module.exports.readFile = function(fs, s, res) {  // lol
		fs.readFile(s, function(err, contents) {
		if(!err) {
			 res.end(contents);
		} else {
			console.log(err);
		}
}); }