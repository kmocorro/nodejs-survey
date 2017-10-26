var express = require('express');
var app = express();

var cookieSession = require('cookie-session');
var apiController = require('./controllers/apiController');


var port = process.env.PORT || 5000;

//  static files, use public
app.use('/', express.static(__dirname + '/public'));
//  set views render
app.set('view engine', 'ejs');
//  session
app.set('trust proxy', 1) // trust first proxy
app.use(cookieSession({
 name: 'session',
 keys: ['key1', 'key2']
}));

//  survey api
apiController(app);

app.listen(port);

