var Campground = require("../models/campground.js");
var Comment = require("../models/comment.js");

//Define a middleware object and then add each middleware attribute 
middlewareObj = {}

//isLoggedIn
middlewareObj.isLoggedIn = function(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    req.flash("error", "You must be logged in to do that!")
    res.redirect("/login");
}

//checkCampgroundOwnership
middlewareObj.checkCampgroundOwnership = function(req, res, next){  //Need these 3 arguments to define a middleware 
    if(req.isAuthenticated()){
        Campground.findById(req.params.id, function(err, foundCampground){
            if(err || !foundCampground){
                req.flash("error", "Campground not found");
                res.redirect("back");
            } else {
                //Does user own campground?
                if(foundCampground.author.id.equals(req.user._id) || req.user.isAdmin ){//check if campground's author id equals users logged in id
                    next();
                } else { //Display error message
                    req.flash("error", "You don't have permission to do that");
                     res.redirect("back");
                }
            };
        });
    } else { //Display error message
        req.flash("error", "You must be logged in to do that!");
        res.redirect("back");
    }
};

//checkCommentOwnership
middlewareObj.checkCommentOwnership = function(req, res, next){  //Need these 3 arguments to define a middleware 
    if(req.isAuthenticated()){
       Comment.findById(req.params.comment_id, function(err, foundComment){
            if(err){
                res.redirect("back");
            } else {
                if(foundComment.author.id.equals(req.user._id) || req.user.isAdmin){//check if campground's author id equals users logged in id
                    next();
                } else { //Display error message
                    req.flash("error", "You don't have permission to do that!");
                    res.redirect("back");
                }
            };
        });
    }else { //Display error message
        req.flash("error", "You must be logged in to do that!")
        res.redirect("back");
    }
};


module.exports = middlewareObj;