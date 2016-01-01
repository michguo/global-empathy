var User = require('./models/user');

module.exports = function(app, passport) {
    var bodyParser = require('body-parser');

    // Add this line below
    app.use(bodyParser.urlencoded({ extended: false }))

    // =====================================
    // HOME PAGE (with login links) ========
    // =====================================
    app.get('/', function(req, res) {
        res.render('index.ejs', {
            loggedIn : typeof req.user !== 'undefined'
        }); // load the index.ejs file
    });

    // =====================================
    // LOGIN ===============================
    // =====================================
    // show the login form
    app.get('/login', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('login.ejs', { message: req.flash('loginMessage') }); 
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function(req, res) {

        // render the page and pass in any flash data if it exists
        res.render('signup.ejs', { message: req.flash('signupMessage') });
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/profile', // redirect to the secure profile section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));
    // =====================================
    // PROFILE SECTION =====================
    // =====================================
    // we will want this protected so you have to be logged in to visit
    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/profile', isLoggedIn, function(req, res) {
        res.render('profile.ejs', {
            loggedIn : true,
            user : req.user // get the user out of session and pass to template
        });
    });

    app.get('/edit', isLoggedIn, function(req, res) {
        res.render('edit.ejs', {
            loggedIn : true,
            user : req.user // get the user out of session and pass to template
        });
    });

    app.post('/update', isLoggedIn, function(req, res) {
        User.findOne({ 'local.email' :  req.user.local.email }, function(err, user) {
            // if there are any errors, return the error
            if (err)
                return done(err);

            // check to see if theres already a user with that email
            if (user) {
                console.log('found user');
                console.log('old first name:');
                console.log(user.local.firstName);
                console.log('new first name');
                console.log(req.param('firstName'));
                // set the user's local credentials
                user.local.email     = req.param('email');
                user.local.firstName = req.param('firstName');
                user.local.lastName = req.param('lastName');
                user.local.country   = req.param('country');
                user.local.interests = req.param('interests');
                // save the user
                user.save(function(err) {
                    if (err)
                        throw err;
                    res.redirect('/profile');
                    // return done(null, newUser);
                });
            }

        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/search', isLoggedIn, function(req, res) {
        var query = { 
            $or: [{'local.country' : req.param('val')},
                  {'local.interests': req.param('val')}]
        }; 

        User.find(query, function(err, users) {
            if (err) {
                return done(err);
            }
            if (users) {
                res.render('search.ejs', {
                    users: users,
                    loggedIn : true
                });
            }
        });
        // res.render('search.ejs');
    });
}

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/login');
}