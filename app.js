// requiring required dependencies

const express = require('express');
const app = express();
const mongoose = require('mongoose');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const flash = require('connect-flash');

// Acquiring the keys
const { MONGO_URI, PORT } = require('./keys');

// Diary Schema
const Secret = require('./model/secret');

app.use(
	session({
		cookie: { maxAge: null },
		secret: 'this is a secret',
		resave: false,
		saveUninitialized: false
	})
);

var sessionStore = new session.MemoryStore();

const User = require('./model/user');

mongoose.set('useNewUrlParser', true);
mongoose.set('useUnifiedTopology', true);

mongoose.connect(MONGO_URI, () => {
	console.log('database connected');
});

app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(flash());
app.use(express.static('public'));
app.use(passport.initialize());
app.use(passport.session());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
passport.use(new LocalStrategy(User.authenticate()));

app.use(cookieParser('secret'));

// flash message
app.use((req, res, next) => {
	res.locals.message = req.session.message;
	delete req.session.message;
	next();
});

app.get('/', (req, res) => {
	res.redirect('/register');
});

//Secret Page || Dairy Page
app.get('/secret', isLoggedIn, (req, res) => {
	res.render('secret');
});

// Post the secret diary
app.post('/secret', (req, res) => {
	if (req.body.secret == '') {
		req.session.message = {
			type: 'danger',
			intro: 'Please add something to the diary'
		};
		return res.redirect('/secret');
	}
	const { secret } = req.body;
	const diary = new Secret({ secret, createdBy: req.user });

	diary
		.save()
		.then((user) => {
			req.session.message = {
				type: 'danger',
				intro: 'Saved Succesfully'
			};
			return res.redirect('/secret');
		})
		.catch((err) => console.log(err));
});

// Register Routes || Sign up route
app.get('/register', (req, res) => {
	res.render('register');
});
app.post('/register', (req, res) => {
	const { username, password } = req.body;

	// Error conditions : Empty fields
	if (password == '') {
		req.session.message = {
			type: 'danger',
			intro: 'There were error(s) in your form:',
			message: 'A password is required'
		};
		return res.redirect('/register');
	}
	if (username == '') {
		req.session.message = {
			type: 'danger',
			intro: 'There were error(s) in your form:',
			message: 'An email is required'
		};
		return res.redirect('/register');
	}

	User.findOne({ username: username })
		.then((savedUser) => {
			if (savedUser) {
				req.session.message = {
					type: 'danger',
					intro: 'There were error(s) in your form:',
					message: 'User already exists'
				};
				return res.redirect('/register');
			}
			User.register(new User({ username: req.body.username }), req.body.password, (err, user) => {
				if (err) {
					return res.render('login');
				}
				passport.authenticate('local')(req, res, () => {
					res.redirect('/secret');
				});
			});
		})
		.catch((err) => {
			console.log(err);
		});
});

// Login Routes
app.get('/login', (req, res) => {
	res.render('login');
});
app.post(
	'/login',
	passport.authenticate('local', {
		successRedirect: '/secret',
		failureRedirect: '/login'
	}),
	(req, res) => {}
);

// Fuction that checks if logged in or not
function isLoggedIn(req, res, next) {
	if (req.isAuthenticated()) {
		return next();
	}
	res.redirect('./login');
}

// Logout Route
app.get('/logout', (req, res) => {
	req.logOut();
	res.redirect('/');
});

app.listen(PORT, () => {
	console.log('server has started');
});
