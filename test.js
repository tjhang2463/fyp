// A test code for trying to use export and require
// For testing db function

var db = require('./db');
db.testConnection();

var ranNum = Math.floor(Math.random() * 100);

var summonPet = function(ranNum) {
	if(ranNum === 0) {
		var ranNum = Math.floor(Math.random() * 100);
		summonPet(this.ranNum);
	} else if(ranNum < 10) {
		console.log('Super Rare');
	} else if(ranNum < 40) {
		console.log('Rare');
	} else {
		console.log('Normal');
	}
}

summonPet(ranNum);