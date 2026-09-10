const express = require("express");
const mongoose = require("mongoose");
const path = require('path')
const methodOverride = require('method-override');
const ejsMat = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const session = require('express-session')
const listingRouter = require("./routs/listing.js")
const reviewRouter = require("./routs/reviews.js")
const userRouter = require("./routs/user.js")
const flash = require('connect-flash');
const passport = require("passport");
const localStrategy = require('passport-local')
const User = require("./models/user.js")                    //// requires the model with Passport-Local Mongoose plugged in

const app = express();
app.set("view engine", 'ejs')
app.set("views", path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride("_method"));
app.engine('ejs', ejsMat);
app.use(express.static(path.join(__dirname, "/public")));

main().then(() => console.log('DB working'))
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

app.use(session({
    secret: 'this is secretecode',
    resave: false,
    saveUninitialized: true,
    cookie: {
        expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    }
}))
app.use(flash());                                   // alwase use this before routs

app.use(passport.initialize())
app.use(passport.session())
passport.use(new localStrategy(User.authenticate()))           // use static authenticate method of model in LocalStrategy

// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());


app.use((req, res, next) => {                   // this is local middlewere which can savs.....              
    res.locals.sMsg = req.flash("success")
    res.locals.dMsg = req.flash("del")
    res.locals.eMsg = [...req.flash("err"), ...req.flash("error")] // use eMsg for both err and error keyword
    res.locals.curruser = req.user
    next();
})

app.get("/", async (req, res) => {
    // let fakeuser = new User({
    //     email: "pikachu@0106",
    //     age: 20,
    //     username: "brijesh_17"
    // });
    // let newuser = await User.register(fakeuser, "mypassword");
    // res.send(newuser)
    res.redirect('listing')
}) 



app.use("/listing", listingRouter);                          // ROUTES listing
app.use("/listing/:id/reviews", reviewRouter);                 //ROUTS     reviews
app.use("/", userRouter);                                        //ROUTS     reviews

app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, 'page not found!!!'))
})

// //CUSTOM ERROR HANDALING
app.use((err, req, res, next) => {
    let { statusCode = 500, message = 'something is wrong from defauly' } = err;
    res.status(statusCode).send(message);
    next();
})

app.listen("8080", () => {
    console.log("server is listing to 8080")
})
