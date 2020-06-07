var express = require("express");
var router = express.Router();
var Campground = require("../models/campground.js");
var middlewareObj = require("../middleware");
var NodeGeocoder = require("node-geocoder");

var options = {
    provider: 'google',
    httpAdapter: 'https',
    apiKey: process.env.GEOCODER_API_KEY,
    formatter: null
  };

var geocoder = NodeGeocoder(options);

////////////////////////////////////////////////////////////////////////

//Landing page 
router.get("/", function(req, res){
    res.render("landing");
});

//SHOW (GET) - show all campgrounds 
router.get("/campgrounds", function(req, res){
    if(req.query.paid) res.locals.success = "Payment succeeded, enjoy your trip!";
    //Get all campgrounds from DB
    Campground.find({}, function(err, allCampgrounds){
        if(err || !allCampgrounds){
            req.flash("error", "Campground not found")
            res.redirect("back");
        } else {
            res.render("campgrounds/index", {campgrounds: allCampgrounds});
        }
    });
}); 

//CREATE (POST) - add a new campground to DB
router.post("/campgrounds", middlewareObj.isLoggedIn, function(req, res){
    //get data from form and add to campgrounds array
    var name = req.body.name;
    var image = req.body.image;
    var price = req.body.price;
    var description = req.body.description;
    var author = {
        id: req.user._id,
        username: req.user.username
    };
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            console.log(err);
            req.flash('error', 'Invalid address — CREATE ROUTE');
            return res.redirect('back');
        }
        // var lat = data.results[0].geometry.location.lat;
        // var lng = data.results[0].geometry.location.lng;
        // var location = data.results[0].formatted_address;
        console.log("-----------------------");
        console.log(data);
        console.log("-----------------------");
        var lat = data[0].latitude;
        var lng = data[0].longitude;
        var location = data[0].formattedAddress;
        var newCampground = {name: name, image: image, price: price, description:description, location: location, lat: lat, lng: lng, author: author};
        //Create a new campground and save to DB
        Campground.create(newCampground, function(err, newlyCreated){
            if(err){
                console.log(err);
                req.flash('error', 'Invalid address yee 2');
                return res.redirect('back');
            } else {
                //redirect back to camprounds page (defualt is to redirect to GET request address)
                console.log(newlyCreated);
                res.redirect("/campgrounds");
            }
        });
    });
});

//NEW (GET) - show form to create new campground
router.get("/campgrounds/new", middlewareObj.isLoggedIn, function(req, res){
    res.render("campgrounds/new");
});

//SHOW (GET) - shows more info about one campground
router.get("/campgrounds/:id", function(req, res){
    //find campground page with provided ID
    //req.params.id will return what the user entered into the brower after /campgrounds/
    Campground.findById(req.params.id).populate("comments").exec(function(err, foundCampground){
        if(err || !foundCampground){
            req.flash("error", "Campground not found")
            res.redirect("back");
        } else {
            // console.log(req.params.id); // To see what it does
            console.log(foundCampground);
            res.render("campgrounds/show", {campground: foundCampground});
        }
    });
});

// //EDIT CAMPGROUND ROUTE (BEFORE MIDDLEWARE)
// router.get("/campgrounds/:id/edit", function(req, res){
//     //Check if user is logged in
//     if(req.isAuthenticated()){
//         Campground.findById(req.params.id, function(err, foundCampground){
//             if(err){
//                 console.log(err);
//                 res.redirect("/campgrounds");
//             } else {
//                 if(foundCampground.author.id.equals(req.user._id)){
//                     res.render("campgrounds/edit", {campground: foundCampground});
//                     console.log(req.params.id); //This is the campgrounds id
//                     console.log(req.user._id); //This is the logged in users id
//                     console.log(foundCampground.author.id); //This is the id of the author of the campground
//                 } else { //Display error message
//                   res.send("you dont have permission to do that!");
//                 }
//             };
//         });
//     }else { //Display error message
//         console.log("user not logged in");
//         res.send("You need to be logged in to do that");
//     }
// });

//EDIT CAMPGROUND ROUTE
router.get("/campgrounds/:id/edit", middlewareObj.checkCampgroundOwnership, function(req, res){
    //Check if user is logged in
    Campground.findById(req.params.id, function(err, foundCampground){
        res.render("campgrounds/edit", {campground: foundCampground});
    });
});

//UPDATE
router.put("/campgrounds/:id", middlewareObj.checkCampgroundOwnership, function(req, res){
    //find and update the correct campground
    geocoder.geocode(req.body.location, function (err, data) {
        if (err || !data.length) {
            console.log(err);
            req.flash('error', 'Invalid address');
            return res.redirect('back');
        }
        req.body.campground.lat = data[0].latitude;
        req.body.campground.lng = data[0].longitude;
        req.body.campground.location = data[0].formattedAddress;

    Campground.findByIdAndUpdate(req.params.id, req.body.campground, function(err, updatedCampground){
        if(err){
            req.flash("error", "err.message");
            res.redirect("/campgrounds");
        } else {
            req.flash("success", "Successfully updated");
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
    });
}); 

//DESTROY CAMPGROUND ROUTE 
router.delete("/campgrounds/:id", middlewareObj.checkCampgroundOwnership, function(req, res){
    Campground.findByIdAndRemove(req.params.id, function(err){
        if(err){
            res.redirect("/campgrounds");
        } else {
            res.redirect("/campgrounds");
        }
    }
)} );


module.exports = router;