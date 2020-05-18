var mongoose = require("mongoose");

//SCHEMA SETUP
var campgroundSchema = new mongoose.Schema({
    name: String,
    image: String,
    price: String,
    description: String,
    location: String,
    lat: Number,
    lng: Number,
    author: {
       id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
        },
        username: String
    },
    //Comments is an array of object ids
    comments: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment"
        }
    ]
});

//The name of the model is Campground
var Campground = mongoose.model("Campground", campgroundSchema);
module.exports = Campground;