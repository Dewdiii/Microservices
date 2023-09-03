var mysql = require('mysql');
var connection = mysql.createConnection({
	host:'localhost',
	user:'root',
	port: 3333,
	password:'root',
	database:'inventory'
});
connection.connect(function(error){
	if(!!error) {
		console.log(error);
	} else {
		console.log('Database Connected Successfully..!!');
	}
});

module.exports = connection;