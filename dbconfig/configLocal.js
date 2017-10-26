var mysql = require('mysql');

let poolLocal = mysql.createPool({
    multipleStatement: true,
    connectionLimit: 1000,
    host:   'localhost',
    user:   'root',
    password:   '2qhls34r',
    database:   'dbParty'
});

exports.poolLocal = poolLocal;
