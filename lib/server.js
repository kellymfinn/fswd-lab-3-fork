'use strict';

var express = require('express'),
    morgan = require('morgan');

var cookieParser = require('cookie-parser');
var session = require('express-session');
var models = require('../models');

// Create the express application object
var app = express();

var bodyParser = require('body-parser');

// to extract form data from POST bodies
app.use(bodyParser.urlencoded({ extended: true }));

app.set('view engine', 'pug');
app.set('views', './views');

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') {
    // Setup the loggin format, depending on running environment
    app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

app.use(cookieParser());
var SequelizeStore = require('connect-session-sequelize')(session.Store);
var sessionStore = new SequelizeStore({
    db: models.sequelize
});
sessionStore.sync();
app.use(session({
    secret: 'Shhhhh!',
    store: sessionStore,
    saveUninitialized: true,
    resave: false
}));

app.use(function(request, response, next) {
    if (request.session.user_id) {
        models.User.findById(request.session.user_id)
            .then(function(user) {
                if (user) {
                    request.user = user;
                    response.locals.user = user;
                }
                next();
            })
    } else {
        next();
    }
});

app.get('/', function(request, response) {
    response.render('index');
});

app.post('/name-form', function(request, response) {
    var url = '/' + request.body.name;
    response.redirect(url);
});

app.post('/tasks', function(request, response) {
    models.Task.create(request.body)
        .then(function(task) {
            request.session.lastTaskCreated = task.name;
            request.session.save(function() {
                response.redirect('/tasks/' + task.id);
            })
        });
});

app.param('task_id', function(request, response, next, task_id) {
    models.Task.findById(task_id)
    .then(function(task) {
        if (!task) {
            response.status(404).send('No task here doofus!');
        } else {
            request.task = task;
            next();
        }    
    })
});

app.get('/tasks/:task_id', function(request, response) {
    response.send('Thanks for task "' + request.task.name + '"');
});

app.get('/tasks', function(request, response) {
    response.send('Last task created is: ' + request.session.lastTaskCreated);
});

app.get('/:name', function(request, response) {
    response.render('name', {
        name: request.params.name,
        lastName: request.query.lastName
    });
});

app.get('/users/register', function(request, response) {
    response.render('users/register');
});

app.post('/users/register', function(request, response) {
    if (request.body.username) {
        models.User.findOne({ where: { username: request.body.username }})
            .then(function(user) {
                if (request.body.username === user.id) {
                    alert: 'Username already exists!'
                } else if (!user) {
                    if (request.body.password === request.body.password_confirm) {
                        models.User.create({
                            username: request.body.username,
                            password: request.body.password
                        })
                            .then(function(newUser) {
                                request.session.user_id = newUser.id;
                                request.session.save(function() {
                                    response.redirect('/users/welcome');
                                });
                            });
                    }
                }
            });
    }
});

app.get('/users/welcome', function(request, response) {
    response.render('users/welcome');
});

app.get('/users/logout', function(request, response) {
    request.session.destroy(function() {
        response.redirect('/');
    });
});

app.get('/users/login', function(request, response) {
    response.render('users/login');
});

app.post('/users/login', function(request, response) {
    if (request.body.username) {
        models.User.findOne({ where: { username: request.body.username }})
            .then(function(user) {
                if (user) {
                    if (user.isValidPassword(request.body.password)) {
                        request.session.user_id = user.id;
                        request.session.save(function() {
                            response.redirect('/users/welcome');
                        });
                    }
                }
            });
    }
});

// Add the static middleware, pointed at the ./public directory
app.use(express.static('public'));

// allow other modules to use the server
module.exports = app;
