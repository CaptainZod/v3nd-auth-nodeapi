// BASE SETUP
// =============================================================================

// call the packages we need
if (process.env.NODE_ENV !== 'production') {
	require('dotenv').config()
  }
// Checking if local execution env like cmd is not production. Require is for cloud env with configuration.


// Express	-	Routing middleware, helps attach middleware for routing.
// BP  		-	Parses HTTP req and response
// Morgan  	-	It is a HTTP request logger middleware for Node. js.
// 				It simplifies the process of logging requests to the app. 
// 				acts as helper that generates request logs. 
// 				It saves developers time because they don't have to manually create these logs.
// Request  -	Request is for making HTTP requests.
// Nexmo 	-	SMS API
// Bcrypt 	-	For encryption
// Passport -	Authenticate and Authorize jwt 
// Flash   -	Tools of express. Flashes messages
//	Express. js uses a cookie to store a session id (with an encryption signature)
//	in the user's browser and then, on subsequent requests, 
//	uses the value of that cookie to retrieve session information stored on the server

// MethodOverride() - Middleware is for requests from clients that only natively 
//support GET and POST. So in those cases you could specify 
//a special query field (or a hidden form field for example) 
//that indicates the real verb to use instead of what was originally sent. 
//That way your backend .put()/.delete()/.patch()/etc.
// routes don't have to change and will still work and you can accept requests from all kinds of clients.
var express    = require('express'); 
var bodyParser = require('body-parser');
var app        = express();
var morgan     = require('morgan'); 
var request = require('request');
const Nexmo = require('nexmo');
 
const nexmo = new Nexmo({
  apiKey: "07c5ccd2",
  apiSecret: "cqSROQY86rlS3g5Z"
});
// Here we make acc to get those credentials
const bcrypt = require('bcrypt');
const passport = require('passport');
const flash = require('express-flash');
const methodOverride = require('method-override')



app.set('view-engine','ejs');
// view engine is templates and styles
//ejs is format

var GoogleStrategy = require('passport-google-oauth').OAuth2Strategy;

passport.use(new GoogleStrategy({
    clientID: 432701598386-cq416k95scm2p4v1vop3hcv9cf4c42kk.apps.googleusercontent.com,
    clientSecret: DYERfJ9RiuYAZB3pqrd7mVW0,
    callbackURL: "http://www.example.com/auth/google/callback"
  },	
  function(accessToken, refreshToken, profile, done) {
       User.findOrCreate({ googleId: profile.id }, function (err, user) {
         return done(err, user);
       });
  }
));

app.use(flash());

app.use(passport.initialize())
app.use(methodOverride('_method'))  

// configure app
app.use(morgan('dev')); // log requests to the console

// configure body parser
// app.use(bodyParser.urlencoded({ extended: true }));
// app.use(bodyParser.json());

app.use(express.urlencoded({extended:false}));

var port     = process.env.PORT || 8080; // set our port

// DATABASE SETUP
//var mongoose   = require('mongoose');
//mongoose.connect('mongodb://node:node@novus.modulusmongo.net:27017/Iganiq8o'); // connect to our database

// Handle the connection event
/*var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));

db.once('open', function() {
  console.log("DB connection alive");
});
*/
// Bear models lives here
var Bear     = require('./app/models/bear');

// ROUTES FOR OUR API
// =============================================================================


//rishi sr code 
// authentication ===========================================
const users = []

app.get('/test', function(req, res) {
	res.render('index.ejs');
})

app.get('/', function(req, res) {
	res.send('V3nd Sol Private Limited');
})

app.get('/login', checkNotAuthenticated, function(req, res) {
	res.render('login.ejs');
})

app.get('/register', function(req, res) {
	res.render('register.ejs');
})

app.post('/login', passport.authenticate('local',	 {
	successRedirect: '/api',
	failureRedirect: '/login',
	failureFlash: true
}))

app.post('/register', async function(req,res){
	
	try{
		const hashedPassword = await bcrypt.hash(req.body.password, 10)	
		users.push({
			id: Date.now().toString(),
			name: req.body.name,
			email: req.body.email,
			password: hashedPassword
		  })
		  res.redirect('/login')
	}
	catch{
		res.redirect('/register')
	}
	console.log(users);

})
app.get('/logout', function(req,res){
	res.render('index.ejs')
})

app.delete('/logout', function(req,res){
	req.logout()
	res.redirect('/login');

})


// create our router
var router = express.Router();

// middleware to use for all requests
router.use(function(req, res, next) {
	// do logging
	console.log('Something is happening.');
	next();
});

// test route to make sure everything is working (accessed at GET http://localhost:8080/api)
router.get('/', checkAuthenticated, function(req, res) {
	const from = 'Nexmo';
	const to = '917338412131';
	const text = 'Hello from Get';

	nexmo.message.sendSms(from, to, text, (err, responseData) => {
    if (err) {
        console.log(err);
    } else {
        if(responseData.messages[0]['status'] === "0") {
            console.log("Message sent successfully.");
        } else {
            console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
	}
	    }
	})
	res.send({ message: 'hooray! welcome to our api!', PS: '/logout to logout' });	
	console.log('test');
});

router.post('/',function(req,res) {

	const from = 'Nexmo';
	const to = '916366642266';
	const text = 'Congratulations';

	nexmo.message.sendSms(from, to, text, (err, responseData) => {
	    if (err) {
		console.log(err);
	    } else {
		if(responseData.messages[0]['status'] === "0") {
		    console.log("Message sent successfully.");
		} else {
		    console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
		}
	    }
	}) 
	
});

// on routes that end in /bears
// ----------------------------------------------------
router.route('/bears')

	// create a bear (accessed at POST http://localhost:8080/bears)
	.post(function(req, res) {
		
		var bear = new Bear();		// create a new instance of the Bear model
		bear.name = req.body.name;  // set the bears name (comes from the request)

		bear.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Bear created!' });
		});

		
	})

	// get all the bears (accessed at GET http://localhost:8080/api/bears)
	.get(function(req, res) {
		Bear.find(function(err, bears) {
			if (err)
				res.send(err);

			res.json(bears);
		});
	});

// on routes that end in /bears/:bear_id
// ----------------------------------------------------
router.route('/bears/:bear_id')

	// get the bear with that id
	.get(function(req, res) {
		Bear.findById(req.params.bear_id, function(err, bear) {
			if (err)
				res.send(err);
			res.json(bear);
		});
	})

	// update the bear with this id
	.put(function(req, res) {
		Bear.findById(req.params.bear_id, function(err, bear) {

			if (err)
				res.send(err);

			bear.name = req.body.name;
			bear.save(function(err) {
				if (err)
					res.send(err);

				res.json({ message: 'Bear updated!' });
			});

		});
	})

	// delete the bear with this id
	.delete(function(req, res) {
		Bear.remove({
			_id: req.params.bear_id
		}, function(err, bear) {
			if (err)
				res.send(err);

			res.json({ message: 'Successfully deleted' });
		});
	});

function checkAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return next()
	}
	
	res.redirect('/login')
	}
	
	function checkNotAuthenticated(req, res, next) {
	if (req.isAuthenticated()) {
		return res.redirect('/')
	}
	next()
	}


// REGISTER OUR ROUTES -------------------------------
app.use('/api', router);

// START THE SERVER
// =============================================================================
app.listen(port);
console.log('Magic happens on port ' + port);
