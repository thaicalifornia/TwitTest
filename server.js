const express = require('express');
const boydyParser = require('body-parser');
const morgan = require('morgan');
const mongoose = require('mongoose');
const expressHbs = require('express-handlebars');
const session = require('express-session');
const MongoStore = require('connect-mongo')(session);
const flash = require('express-flash');
const hbs = require('hbs');
const passport = require('passport');
const passportSocketIo = require('passport.socketio');
const cookieParser = require('cookie-parser');

const config = require('./config/secret');

const app = express();
const http = require('http').Server(app);
const io = require('socket.io')(http);

const sessionStore = new MongoStore({ url: config.database, autoReconnect: true })

mongoose.connect(config.database, function(err){
  if(err) console.log(err);
  console.log('Connect database');
});

app.engine('.hbs', expressHbs({ defaultLayout: 'layouts', extname: '.hbs'}));
app.set('view engine', 'hbs');
app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(boydyParser.json());
app.use(boydyParser.urlencoded({ extended: true}));
app.use(session({
  resave: true,
  saveUninitialized: true,
  secret: config.secret,
  store: sessionStore
  // store: new MongoStore({ url: config.database, autoReconnect: true })
}));
app.use(flash());
app.use(cookieParser());
app.use(passport.initialize());
app.use(passport.session());
app.use(function(req,res,next){
  res.locals.user = req.user;
  next();
});

io.use(passportSocketIo.authorize({
  cookieParser: cookieParser,
  key: 'connect.sid',
  secret: config.secret,
  store: sessionStore, 
  success: onAuthorizeSuccess,
  fail: onAuthorizeFail
}));

function onAuthorizeSuccess(data, accept) {
  console.log("successful connection");
  accept();
}

function onAuthorizeFail(data, message, error, accept) {
  console.log("failed connection");
  if (error) accept(new Error(message));
}


require('./realtime/io')(io);

const mainRoutes = require('./routes/main');
const userRoutes = require('./routes/user');

app.use(mainRoutes);
app.use(userRoutes);



http.listen(3000,(err) => {
  if(err){
    console.log(err);
  } else {
    console.log(`Running on Port ${3000}`);
  }
});

// app.listen(3000,(err) => {
//   if(err){
//     console.log(err);
//   } else {
//     console.log(`Running on Port ${3000}`);
//   }
// });

