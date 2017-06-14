const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const massive = require('massive');
const session = require('express-session');
const webpack = require('webpack');
const cors = require('cors');
const passport = require('passport');
const Auth0Strategy = require('passport-auth0');
const servConfig = require('./servConfig');
const config = require('../webpack.config.dev');

const app = module.exports = express();
const port = 8080;

app.use(bodyParser.json());
app.use(session({
    secret: servConfig.sessionSecret,
    resave: true,
    saveUninitialized: true
}));

// Configure Passport to use Auth0
var strategy = new Auth0Strategy({
    domain:       process.env.AUTH0_DOMAIN,
    clientID:     process.env.AUTH0_CLIENT_ID,
    clientSecret: process.env.AUTH0_CLIENT_SECRET,
    callbackURL:  process.env.AUTH0_CALLBACK_URL || 'http://localhost:3000/callback'
  }, function(accessToken, refreshToken, extraParams, profile, done) {
    // accessToken is the token to call Auth0 API (not needed in the most cases)
    // extraParams.id_token has the JSON Web Token
    // profile has all the information from the user
    return done(null, profile);
  });

passport.use(strategy);

// This can be used to keep a smaller payload
passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

app.use(express.static('../src'));
app.use(passport.initialize())
app.use(passport.session())

var corsOptions = {
    origin: 'http://localhost:8080'
}

app.use(cors());

app.use(function(req, res, next){
    var allowedOrigins = ['http://localhost:3000']
    var origin = req.headers.origin
    if(allowedOrigins.indexOf(origin) > -1){
        res.setHeader('Access-Control-Allow-Origin', origin)
    }
    res.header('Access-Control-Allow-Methods', ['GET','PUT','POST','DELETE']);
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    res.header('Access-Control-Allow-Credentials', true);
    return next();
})

const db = massive.connectSync({
    connectionString: "postgres://puprirrmuovopb:61522d021aa9213387ac952d5e4bd3e60862fb98f2d3cf9212db6f753219cdbe@ec2-23-21-220-48.compute-1.amazonaws.com:5432/dfuhk1hpm6bjkj?ssl=true"
});
app.set('db', db);

const compiler = webpack(config);


app.use(require('webpack-dev-middleware')(compiler, {
  noInfo: true,
  publicPath: config.output.publicPath
}));

app.use(require('webpack-hot-middleware')(compiler));



//-------Render html through nodemon--------------------------------------



//app.get('*', function(req, res) {
//  res.sendFile(path.join(__dirname, '../public/index.html'))
//})



//------Database calls----------------------------------------------------

//GET REQUESTS============================================================



app.get('/api/ships', function(req, res){
    db.getAllShips(function(err, ships){
        res.send(ships)
    })
})

app.get('/api/topScores', function(req, res){
    db.getTopScores(function(err, scores){
        res.send(scores)
    })
})

app.get('/api/users', function(req, res){
    db.getUsers(function(err, users){
        res.send(users)
    })
})

app.get('/api/users/:id', function(req, res){
    var userId = req.params.id;
    db.getUserById([userId], function(err, users){
        res.send(users)
    })
})

app.get('/api/users/:username/:password', function(req, res){
    var username = req.params.username;
    var password = req.params.password;
    db.loginUser([username, password], function(err, user){
        res.send(user);
    })
})

app.put('/api/usersupdate/:id', function(req, res){
    var userId = req.params.id;
    var update = req.body;
    db.updateHighscoreAndTotalCoins([userId, update.highscore, update.totalcoins], function(err){
        res.send("updated points and coins");
    })
})



app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});