var bodyParser = require('body-parser');
var mysqlLocal = require('../dbconfig/configLocal').poolLocal;
var Promise = require('bluebird');
var moment = require('moment');


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
                        req.session.schedule = validate_user_obj[0].schedule;

                        res.send('ok');

                    } else {
                        res.send(post_employee_id + ' was already participated. <br /><i>If you believed that you have not yet participated, <br />Please contact <a href="mailto:kevin.mocorro@sunpowercorp.com?Subject=Need%20Help,%20(Please%20use%20outlook%20when%20sending%20an%20email)" target="_blank">Kevin Mocorro </a>:)</i>');
                    }
                } else {
                    res.send('Sorry, ID number or Lastname is incorrect <br/>(ex: 12345) <br/>(ex: Mocorro / Mocorro Jr / Mocorro III )');
                }
            });
            connection.release(); // never forget;
        });
    });

    //  validate and store survey details
    app.post('/survey/validate', function(req, res){
        let post_radio = req.body.optradio;
        let post_whyNot = req.body.whySelect;
        let user_id_from_session = req.session.employee_id;

        // check user if tries to press the back button and re-survey again
        mysqlLocal.getConnection(function(err, connection){
            connection.query({
                sql: 'SELECT isDone FROM tbl_user_info WHERE employee_id = ?',
                values: [user_id_from_session]
            },  function(err, results, fields){
                if(results.length < 0){
                    res.send('Sorry, you are not authorized to do that again. <br/><i>Opportunity never knocks twice</i></center>');
                } else {
                    let ggVal = results[0].isDone;
                    if(ggVal !== 1){
                        // if the user didn't try to go back
                        if(post_radio !== "Yes" ){
                            mysqlLocal.getConnection(function(err, connection){
                                connection.query({
                                    sql: 'UPDATE tbl_user_info SET willAttend=?, isDone=?, whyNot=?, isRegistered=? WHERE employee_id=?',
                                    values:[post_radio, 1, post_whyNot, 'Registered', user_id_from_session]
                                }, function(err, results, fields){
                                    res.send('ok');
                                });
                                connection.release();
                            });
                        } else if(post_radio == "Yes") {
                                    
                            let post_shuttleIn = req.body.shuttleIn;
                            let post_shuttleOut = req.body.shuttleOut;
            
                            mysqlLocal.getConnection(function(err, connection){
                                connection.query({
                                    sql: 'UPDATE tbl_user_info SET willAttend=?, shuttleRoute=?, shuttleROuteOut=?, isDone=?, whyNot=?, isRegistered=? WHERE employee_id=?',
                                    values:[post_radio, post_shuttleIn, post_shuttleOut, 1, 'I will attend', 'Registered',user_id_from_session]
                                }, function(err, results, fields){
                                    res.send('ok');
                                });
                                connection.release();
                            });
                        
                        }        
    
                    } else {
                        res.send('<center>' + user_id_from_session + ' was already participated. <br/><i>Opportunity never knocks twice</i></center>');
                    }

                }
                
            }); 
            connection.release();
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
        mysqlLocal.getConnection(function(err, connection){
            connection.query({
                sql: 'SELECT * FROM tbl_shuttle_info'
            },  function(err, results, fields){
                let shuttle_obj=[];
                    for(let i=0;i<results.length;i++){
                        shuttle_obj.push({
                            shuttle: results[i].shuttleRoute
                        });
                    }
                    // user names and details from session
                    let user_session = [];
                    if(req.session.firstname !== null && req.session.firstname !== null && req.session.lastname !== null && req.session.position !== null && req.session.department !== null && req.session.shift !== null){
                        user_session.push({
                            firstname: req.session.firstname,
                            lastname: req.session.lastname,
                            position: req.session.position,
                            department: req.session.department,
                            shift: req.session.shift,
                            schedule: moment(req.session.schedule).format('MMMM Do YYYY, h A')
                        });
                    }
                    
                res.render('home',{user_session, shuttle_obj});
            });
            connection.release();
        });
    });

    // thank you page
    app.get('/thankyou', checkAuth, function(req, res){
        delete req.session.firstname;
        res.render('thankyou');
    });

    //  reports
    app.get('/reports', function(req, res){

        function numberOfregistered(){
            return new Promise(function(resolve, reject){
                mysqlLocal.getConnection(function(err, connection){
                    if(err){reject(err);}
                    connection.query({
                        sql: 'SELECT isRegistered, COUNT(isRegistered) AS num FROM tbl_user_info GROUP BY isRegistered'
                    },  function(err, results, fields){
                        if(err){reject(err);}
                        let numberOfregistered_obj=[];
                            for(let i=0;i<results.length;i++){
                                numberOfregistered_obj.push({
                                    isRegistered: results[i].isRegistered,
                                    values: results[i].num
                                });
                            }
                        resolve(numberOfregistered_obj);
                    });
                connection.release();
                });
            });
        }

        function numberOfattendees(){
            return new Promise(function(resolve, reject){
                mysqlLocal.getConnection(function(err, connection){
                    if(err){reject(err);}
                    connection.query({
                        sql: 'SELECT willAttend, COUNT(willAttend) AS num FROM tbl_user_info GROUP BY willAttend ORDER BY COUNT(willAttend) ASC'
                    },  function(err, results, fields){
                        if(err){reject(err);}
                        let numberOfattendees_obj=[];
                            for(let i=0;i<results.length;i++){
                                numberOfattendees_obj.push({
                                    willAttend: results[i].willAttend,
                                    values: results[i].num
                                });
                            }
                        resolve(numberOfattendees_obj);
                    });
                connection.release();
                });
            });
        }

        function numberOfRoutes(){
            return new Promise(function(resolve, reject){
                mysqlLocal.getConnection(function(err, connection){
                    if(err){reject(err);}
                    connection.query({
                        sql: 'SELECT A.shuttleRoute as shuttleName, A.incoming AS incoming, B.outgoing AS outgoing FROM (SELECT A.shuttleRoute, COUNT(B.shuttleRoute) AS incoming FROM tbl_shuttle_info A LEFT JOIN tbl_user_info B ON A.shuttleRoute = B.shuttleRoute GROUP BY A.shuttleRoute ORDER BY incoming DESC) A LEFT JOIN (SELECT A.shuttleRoute, COUNT(B.shuttleROuteOut) AS outgoing FROM tbl_shuttle_info A LEFT JOIN tbl_user_info B on A.shuttleRoute = B.shuttleROuteOut GROUP BY A.shuttleRoute ORDER BY outgoing DESC) B ON A.shuttleRoute = B.shuttleRoute GROUP BY A.shuttleRoute, B.shuttleRoute ORDER BY A.incoming DESC, B.outgoing DESC'
                    },  function(err, results, fields){
                        if(err){reject(err);}
                        let numberOfRoutes_obj=[];
                            for(let i=0;i<results.length;i++){
                                numberOfRoutes_obj.push({
                                    shuttleName: results[i].shuttleName,
                                    values_incoming: results[i].incoming,
                                    values_outgoing: results[i].outgoing
                                });
                            }
                        resolve(numberOfRoutes_obj);
                    });
                connection.release();
                });
            });
        }

        numberOfregistered().then(function(numberOfregistered_obj){
            return numberOfattendees().then(function(numberOfattendees_obj){
                return numberOfRoutes().then(function(numberOfRoutes_obj){
                    res.render('reports', {numberOfregistered_obj, numberOfattendees_obj, numberOfRoutes_obj});
                });
            });
        });
        
    });

    // logout
    app.get('/logout', function(req, res){
        delete req.session.employee_id;
        res.redirect('/');
    });


    function checkAuth(req, res, next) {
        if (!req.session.employee_id || !req.session.firstname) {
          res.redirect('/');
        } else {
          next();
        }
    }


}