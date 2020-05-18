var mongoose                = require("mongoose");
var passportLocalMongoose   = require("passport-local-mongoose");

var UserSchema = new mongoose.Schema({
    username: String,
    password: String,
    isAdmin: {type: Boolean, default: false}
});

//Methods required for authentication 
UserSchema.plugin(passportLocalMongoose);

module.exports = mongoose.model("User", UserSchema);
