var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    text: String,
    author: {
        id: { type: mongoose.Schema.Types.ObjectId,
            ref: "User"  //ref refers to the User model that we are refering to,
            },
        username: String
    }
});

module.exports = mongoose.model("Comment", commentSchema);