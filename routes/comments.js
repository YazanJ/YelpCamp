var express = require("express");
var router = express.Router();
var Campground = require("../models/campground.js");
var Comment = require("../models/comment");
var middlewareObj = require("../middleware");

//NEW (GET) - a form for users to add comments 
router.get("/campgrounds/:id/comments/new", middlewareObj.isLoggedIn, function(req, res){
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log.log(err);
        } else {
            res.render("comments/new", {campground: campground});
        }
    });
});

//CREATE (POST)
router.post("/campgrounds/:id/comments", middlewareObj.isLoggedIn, function(req, res){
    //lookup campground using id
    Campground.findById(req.params.id, function(err, campground){
        if(err){
            console.log(err);
        } else {
            //create a new comment
            Comment.create(req.body.comment, function(err, comment){
                if(err){
                    req.flash("error", "Something went wrong");
                    console.log(err);
                } else {
                    //add username and id to comment    //req.user is refering to the user that is currently logged in (can only reach here if there is a user logged in)
                    comment.author.id = req.user._id;  //comment here refers to the comment in return value in the function above
                    comment.author.username = req.user.username;
                    //save comment
                    comment.save();
                    //add comment to the looked-up campground
                    campground.comments.push(comment);
                    campground.save();
                    req.flash("success", "Successfully added commet");
                    res.redirect("/campgrounds/" + campground._id);
                }
            });
        }
    });
});

//EDIT COMMENTS
router.get("/campgrounds/:id/comments/:comment_id/edit", middlewareObj.checkCommentOwnership, function(req, res){
    Comment.findById(req.params.comment_id, function (err, foundComment){
        if(err){
            res.redirect("back");
        } else {
            res.render("comments/edit", {campground_id: req.params.id, comment: foundComment}) //Only need campground id rather than whole campground data
        }
    })
});

//UPDATE 
router.put("/campgrounds/:id/comments/:comment_id", middlewareObj.checkCommentOwnership, function(req, res){
    Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, function(err, updatedComment){
        if(err){
            res.redirect("back");
        } else{
            res.redirect("/campgrounds/" + req.params.id);
        }
    });
});

//DESTORY ROUTE
router.delete("/campgrounds/:id/comments/:comment_id", middlewareObj.checkCommentOwnership, function(req, res){
   Comment.findByIdAndRemove(req.params.comment_id, function(err){
       if(err){
           res.redirect("back");
       } else {
           req.flash("success", "Comment deleted");
           res.redirect("/campgrounds/" + req.params.id);
       }
   });
});

module.exports = router;