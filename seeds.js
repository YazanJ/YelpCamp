//The function below, seedDB, will be exported to app.js
//The use of seed.js is to delete all campgrounds and add the same 3 new ones everytime the we start or restart the app.

var mongoose = require("mongoose");
var Campground = require("./models/campground.js");
var Comment = require("./models/comment.js");


var data = [
    {
    name: "Yazan's Lake",
    image: "https://image.shutterstock.com/image-photo/mountain-landscape-lake-range-large-260nw-1017466240.jpg",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sed elementum tempus egestas sed sed risus pretium quam vulputate. Bibendum neque egestas congue quisque egestas diam. Mauris in aliquam sem fringilla ut morbi tincidunt augue interdum. Sit amet commodo nulla facilisi nullam vehicula. Non diam phasellus vestibulum lorem sed risus ultricies tristique. Tellus id interdum velit laoreet id. Lectus quam id leo in vitae turpis. "
    },
    {
    name: "John's Lake",
    image: "https://images.pexels.com/photos/247600/pexels-photo-247600.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sed elementum tempus egestas sed sed risus pretium quam vulputate. Bibendum neque egestas congue quisque egestas diam. Mauris in aliquam sem fringilla ut morbi tincidunt augue interdum. Sit amet commodo nulla facilisi nullam vehicula. Non diam phasellus vestibulum lorem sed risus ultricies tristique. Tellus id interdum velit laoreet id. Lectus quam id leo in vitae turpis. "
    },
    {
    name: "Lara's Lake",
    image: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/Classic_view_of_a_cloudfree_Peyto_Lake%2C_Banff_National_Park%2C_Alberta%2C_Canada_%284110933448%29.jpg/330px-Classic_view_of_a_cloudfree_Peyto_Lake%2C_Banff_National_Park%2C_Alberta%2C_Canada_%284110933448%29.jpg",
    description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Sed elementum tempus egestas sed sed risus pretium quam vulputate. Bibendum neque egestas congue quisque egestas diam. Mauris in aliquam sem fringilla ut morbi tincidunt augue interdum. Sit amet commodo nulla facilisi nullam vehicula. Non diam phasellus vestibulum lorem sed risus ultricies tristique. Tellus id interdum velit laoreet id. Lectus quam id leo in vitae turpis. "
    }
]

function seedDB(){
    //Remove all Campgrounds
    Campground.remove({},function(err){
        if(err){
            console.log(err);
        }
        console.log("removed campgrounds ");
        //add the 3 campgrounds in the data array
        data.forEach(function(seed){
            Campground.create(seed, function(err, campground){
                if(err){
                    console.log(err);
                } else {
                    console.log("added a campground");
                    //create a comment 
                    Comment.create(
                        {
                            text: "This place looks awesome",
                            author: "Batman"
                        }, function(err, comment){
                            if(err){
                                console.log(err);
                            } else {
                                campground.comments.push(comment);
                                campground.save();
                                console.log("created a new comment");
                            }
                        }
                    );
                }
            });
    });
    });
    
}

module.exports = seedDB;