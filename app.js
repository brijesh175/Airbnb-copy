require('dotenv').config()
// console.log(process.env)

const express = require("express");
const mongoose = require("mongoose");
const path = require('path')
const methodOverride = require('method-override');
const ejsMat = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");
const session = require('express-session')
const { MongoStore } = require("connect-mongo");
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

main().catch(err => {
    console.error('Application startup failed:', err.message);
    process.exit(1);
});

async function main() {
    const mongoUrl = process.env.MONGO_URL;
    if (!mongoUrl) {
        throw new Error('MONGO_URL is missing. Set it in .env using your rotated MongoDB Atlas connection string.');
    }
    if (process.env.NODE_ENV === 'production' && !process.env.SESSION_SECRET) {
        throw new Error('SESSION_SECRET is required in production.');
    }
    await mongoose.connect(mongoUrl);
    console.log('DB working');
    const port = process.env.PORT || 8080;
    app.listen(port, () => console.log(`server is listening on ${port}`));
}

const store = MongoStore.create({
    mongoUrl: process.env.MONGO_URL,
    crypto:{
        secret : process.env.MONGO_URL,
    },
    touchAfter: 24 * 3600,
})
store.on("error" , () => {
    console.log("ERROR in mongo session store , error")
})

app.use(session({
    store,
    secret: process.env.SESSION_SECRET || 'development-only-change-me',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
        sameSite: 'lax',
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

//CUSTOM ERROR HANDALING
app.use((err, req, res, next) => {
    let { statusCode = 500, message = 'something is wrong from defauly' } = err;
    if (res.headersSent) return next(err);
    res.status(statusCode).send(message);
})

 
