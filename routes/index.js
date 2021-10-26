const express = require("express"),
    Campground = require("../models/campground.js"),
    Users = require("../models/user.js"),
    router = express.Router(),
    passport = require("passport"),
    User = require("../models/user"),
    async = require("async"),
    nodemailer = require("nodemailer"),
    crypto = require("crypto");

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

//SIGNUP ROUTE
router.get("/signup", function (req, res) {
    res.render("signup");
});

router.post("/signup", function (req, res) {
    var newUser = new User({ username: req.body.username, email: req.body.email });
    //eval(require('locus')); Npm install locus — this will stop the code here and allow you to evalute the code. really useful
    if (req.body.adminCode) {
        if (req.body.adminCode === process.env.YELP_ADMIN_CODE) {
            newUser.isAdmin = true;
        } else {
            req.flash("error", "Incorrect Admin Code, try again");
            res.redirect("back");
        }
    }
    //the register method is responsible for dealing with the password — I.e. hashing it  
    User.register(newUser, req.body.password, function (err, user) {
        if (err) {
            req.flash("error", "err.message: " + err.message);
            return res.redirect("/signup");
        }
        passport.authenticate("local")(req, res, function () {
            req.flash("success", "Welcome to YelpCamp " + user.username);
            res.redirect("/campgrounds");
        });
    });
});

//Login form
router.get("/login", function (req, res) {
    res.render("login");
});

//Login logic
router.post("/login", passport.authenticate("local", {
    successRedirect: "/campgrounds",
    failureRedirect: "/login"
}));

//Logout logic
router.get("/logout", function (req, res) {
    req.logout();
    req.flash("success", "Successfully logged out");
    res.redirect("/campgrounds");
});

//------------------------------------------------------
//  Admin 
//------------------------------------------------------
router.get("/admin", function (req, res) {
    // if(currentUser && currentUser.isAdmin){
    // res.render("admin");
    // } else{
    //     req.flash("error", "You don't have access to this page");
    // }
    Users.find({}, function (err, allUsers) {
        if (err || !allUsers) {
            req.flash("error", "User not found")
            res.redirect("back");
        } else {
            res.render("admin", { users: allUsers });
        }
    });
});

router.delete("/admin/:id/delete", function (req, res) {
    Users.findByIdAndRemove(req.params.id, function (err) {
        if (err) {
            console.log(err);
            res.redirect("back");
        } else {
            req.flash("success", "Removed User");
            res.redirect("/admin");
        }
    });
});

//------------------------------------------------------
//  PASSWORD RESET 
//------------------------------------------------------

router.get("/forgot", function (req, res) {
    res.render("forgot");
    if (req.user) {
        return console.log(req.user);
    }
});

router.post("/forgot", function (req, res) {
    async.waterfall([
        function (done) {   //done is a callback function
            crypto.randomBytes(20, function (err, buf) {  //Creates a randon token 20 characters long (20 bytes)
                var token = buf.toString('hex');    //convert token from binary to hex
                done(err, token);  //token is the output of this function
            });
        },
        function (token, done) { //the first argument takes the value of the output of the prevoous function, i.e. token
            User.findOne({ email: req.body.email }, function (err, user) {
                console.log(user);
                if (!user) {
                    req.flash("error", "No account with that email address exists.");
                    return res.redirect("/forgot");
                }
                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; //1 hour
                console.log(user);
                user.save(function (err) {
                    done(err, token, user);
                });
            });
        },
        function (token, user, done) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.GMAIL_EMAIL,
                    pass: process.env.GMAIL_PASSWORD,
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.GMAIL_EMAIL,
                subject: 'YelpCamp Password reset',
                text: 'Dear ' + user.username + "\n\n" +
                    'You are receiving this because you have requested to reset your account password.\n\n' +
                    'Please click on or paste the following link into your browser to reset your password:\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If this was not you, please ignore this email and your password will remain unchanged.\n\n' +
                    'Best wishes, \n' +
                    'Yazan Judeh \n' +
                    'Founder and CEO \n\n'
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                console.log("mail sent");
                req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function (err) {
        if (err) return console.log(err);
        res.redirect('/forgot');
    });
});

router.get("/reset/:token", function (req, res) {
    User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
        if (!user) {
            req.flash('error', 'Password reset token is invalid or has expired.');
            return res.redirect('/forgot');
        }
        res.render('reset', { token: req.params.token });
    });
});

router.post('/reset/:token', function (req, res) {
    async.waterfall([
        function (done) {
            User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function (err, user) {
                if (!user) {
                    req.flash('error', 'Password reset token is invalid or has expired.');
                    return res.redirect('back');
                }
                if (req.body.password === req.body.confirm) {
                    user.setPassword(req.body.password, function (err) {
                        user.resetPasswordToken = undefined;
                        user.resetPasswordExpires = undefined;
                        user.save(function (err) {
                            req.logIn(user, function (err) {
                                done(err, user);
                            });
                        });
                    })
                } else {
                    req.flash("error", "Passwords do not match.");
                    return res.redirect('back');
                }
            });
        }
    ], function (err) {
        res.redirect("/campgrounds");
    });
});

//------------------------------------------------------------
//  RESERVE and CHECKOUT ROUTE (STRIPE)
//------------------------------------------------------------

//RESERVE ROUTE
router.get("/campgrounds/:id/reserve", function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            req.flash("error", "No campground with that id found");
            res.redirect("back");
        } else {
            res.render("reserve", { campground: foundCampground });
        }
    })
});

router.post("/campgrounds/:id/reserve", function (req, res) {
    Campground.findById(req.params.id, function (err, foundCampground) {
        if (err) {
            req.flash("error", "No campground with that id found");
            res.redirect("back");
        } else {
            var price = foundCampground.price;
            var nights = req.body.nights;
            var totalPrice = nights * price;
            var location = foundCampground.name;
            res.render("checkout.ejs", { nights, totalPrice, price, location, campground: foundCampground });
        }
    });
});

//POST PAY
router.post("/pay", isLoggedIn, async (req, res) => {
    const { paymentMethodId, items, currency, totalPrice, price, nights, location } = req.body;
    var amount = totalPrice * 100;

    try {
        // Create new PaymentIntent with a PaymentMethod ID from the client.
        const intent = await stripe.paymentIntents.create({
            amount,
            currency,
            payment_method: paymentMethodId,
            error_on_requires_action: true,
            confirm: true
        });

        //Payment recieved if reached here (since there is an await function)
        console.log("💰 Payment received!");
        //set isPaid property of User model to true
        req.user.isPaid = true;
        //console.log("Current user is " + req.user);
        await req.user.save();
        // The payment is complete and the money has been moved
        res.send({ clientSecret: intent.client_secret });
        ////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
        // You can add any post-payment code here (e.g. shipping, fulfillment, etc)
        //Sending confirmation email of purchase 
        User.findOne({ username: req.user.username }, function (err, user) {
            var smtpTransport = nodemailer.createTransport({
                service: 'Gmail',
                auth: {
                    user: process.env.GMAIL_EMAIL,
                    pass: process.env.GMAIL_PASSWORD
                }
            });
            var mailOptions = {
                to: user.email,
                from: process.env.GMAIL_EMAIL,
                subject: 'YelpCamp Booking Confirmation',
                text:
                    `Dear ${user.username}, 
                
                You're going on Holiday!

                Price per night: $${price}
                Number of nights booked: ${nights}
                Total: $${totalPrice}

                For more infromation about your booking, visit:
                "http://${req.headers.host}/campgrounds/"

                Have a great trip :)

                Best Wishes,
                Yazan Judeh
                Founder & CEO

                `
            };
            smtpTransport.sendMail(mailOptions, function (err) {
                if (err) {
                    console.log(err);
                    req.flash("error", "There was a problem sending an email confirmation.");
                    res.redirect("back");
                } else {
                    console.log("mail successfully sent");
                    req.flash('success', 'An e-mail has been sent to ' + user.email + ' for booking confirmation.');
                    res.redirect("/campgrounds");
                }
            });
        });

        // The payment intent contians a client secret, a key unique to the individual payment intent.
        // Send the client secret to the client to use in the demo

    } catch (e) {
        // Handle "hard declines" e.g. insufficient funds, expired card, card authentication etc
        // See https://stripe.com/docs/declines/codes for more
        if (e.code === "authentication_required") {
            res.send({
                error:
                    "This card requires authentication in order to proceed. Please use a different card."
            });
        } else {
            res.send({ error: e.message });
        }
    }
});

//Middleware
//'next' is the function that will be called after this middleware 
//This function can be used anywhere, it checks if a user is logged in. 
//This function is placed as an argument in a route, if there is a user logged in then it will move to the next argument which represents the function next()
function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    if (req['headers']['content-type'] === 'application/json') {
        return res.send({ error: 'Login required' });
    }
    req.flash("error", "You need to login to do that");
    res.redirect("/login");
}

module.exports = router;