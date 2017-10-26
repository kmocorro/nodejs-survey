var bodyParser = require('body-parser');
var mysqlLocal = require('../dbconfig/configLocal').poolLocal;
var Promise = require('bluebird');


module.exports = function(app){

    //  look for http request, parse out json from http request
    app.use(bodyParser.json());
    //  make sure that this api can handle url requests
    app.use(bodyParser.urlencoded({ extended: true }));

    //  check login credentials
    app.post('/login/validate', function(req, res){
        //  from the form posted by login.js
        let post_employee_id = req.body.employee_id;
        let post_lastname = req.body.lastname;

        mysqlLocal.getConnection(function(err, connection){
            connection.query({
                sql: 'SELECT * FROM tbl_user_info WHERE employee_id=? AND lastname=?',
                values: [post_employee_id, post_lastname]
            },  function(err, results, fields){
                let validate_user_obj=[];

                if(typeof results !== "undefined" && results !== null && results.length > 0){
                    if(results[0].isDone!==1){ //  check if the user is done?
                        for(let i=0;i<results.length;i++){
                            validate_user_obj.push({
                                employee_id: results[i].employee_id,
                                lastname: results[i].lastname,
                                firstname: results[i].firstname,
                                position: results[i].position,
                                department: results[i].department,
                                shift: results[i].shift,
                                schedule: results[i].schedule,
                                isDone: results[i].isDone
                            });
                        }
                        // store to session
                        req.session.employee_id = validate_user_obj[0].employee_id;
                        req.session.lastname = validate_user_obj[0].lastname;
                        req.session.firstname = validate_user_obj[0].firstname;
                        req.session.position = validate_user_obj[0].position;
                        req.session.department = validate_user_obj[0].department;
                        req.session.shift = validate_user_obj[0].shift;

                        res.send('ok');

                    } else {
                        res.send(post_employee_id + ' was already participated. <br /><i>If you have not yet participated, <br />Please contact <a href="mailto:kevin.mocorro@sunpowercorp.com?Subject=Need%20Help" target="_blank">Kevin Mocorro </a>:)</i>');
                    }
                } else {
                    res.send('Sorry, ID number or Lastname is incorrect');
                }
            });
            connection.release(); // never forget;
        });
    });

    // to check how many employees pre-registered.
    app.get('/', function(req, res){
        mysqlLocal.getConnection(function(err, connection){
            connection.query({
                sql: 'SELECT SUM(isDone) AS numOfreg FROM tbl_user_info'
            },  function(err, results, fields){
                let count_reg_obj=[];
                if(typeof results !== "undefined" && results !== null && results.length > 0){
                    count_reg_obj.push({
                        numOfreg: results[0].numOfreg
                    });
                    
                res.render('index',{count_reg_obj});
                }
            });
            connection.release();
        });
    });
    
    // home page
    app.get('/home', checkAuth, function(req, res){

    });

    // thank you page
    app.get('/thankyou', checkAuth, function(req, res){

    });

    // logout
    app.get('/logout', function(req, res){

    });


    function checkAuth(req, res, next) {
        if (!req.session.employee_id) {
          res.render('authfail');
        } else {
          next();
        }
    }


}