require("dotenv").config(); //To use environment variables
const express        = require("express"),
    app              = express(),
    bodyParser       = require("body-parser"),
    mongoose         = require("mongoose"),
    flash            = require("connect-flash"),
    passport         = require("passport"),
    LocalStrategy    = require("passport-local"),
    methodOverride   = require("method-override"),
    User             = require("./models/user"),
    commentRoutes    = require("./routes/comments"),
    campgroundRoutes = require("./routes/campground"),
    indexRoutes      = require("./routes/index");

//One-time creation of a database. Then connecting to this database next time: yelp_camp
//localhost:27017 is the port where mongod is running
const DB_URL = process.env.DATABASEURL || 'mongodb://localhost:27017';
mongoose.connect(DB_URL, {useNewUrlParser: true});

app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public")); //Telling it to serve the public directory, __dirname gives the path of the currently running file
app.use(methodOverride("_method")); //_method is the conventional thing to use (used later for PUT request)
app.use(flash()); 

//PASSPORT CONFIG
app.use(require("express-session")({
    secret: "Yaz is a beast",
    resave: false,
    saveUninitialized: false
}));

app.use(express.json()); //for stripe
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

//Response local variables scoped to the request 
app.use(function(req, res, next){
    //currentUser returns 'undefined' if no one is logged in. Otherwise, returns an object with '_id' and 'username'. req.user is coming from passport
    res.locals.currentUser = req.user; 
    res.locals.error = req.flash("error");
    res.locals.success = req.flash("success");
    next();                                                    
});                                  

app.use(indexRoutes);
app.use(campgroundRoutes);  
app.use(commentRoutes);

var port = process.env.PORT || 3000;
app.listen(port, function(){
    console.log("Server has started...");
});