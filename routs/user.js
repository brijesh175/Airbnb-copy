const express = require("express");
const router = express.Router();
const User = require("../models/user.js")
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middlewere.js")

router.get("/signup", (req, res) => {
    res.render('./users/signup.ejs')
})

router.post("/signup", wrapAsync(async (req, res) => {

    try {
        let { username, email, password, age } = req.body;
        const newUser = new User({ email, username, age });
        const regusr = await User.register(newUser, password);
        req.login(newUser, (err) => {
            if (err) {
                return next(err)
            }
            req.flash('success', "user is registered")
            res.redirect("/listing")
        })
    } catch (error) {
        req.flash("err", error.message)
        res.redirect("/signup")
    }
}))

router.get("/login", async (req, res) => {
    res.render('./users/login.ejs')
})

router.post("/login", saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }), async (req, res) => {

    req.flash("success", "welcome back to our website")
    res.redirect(res.locals.redirectUrl || "/listing");         //listing for if you login directly from login btn and there is no any redirect url
})

router.get("/logout", (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "thik chhe you ar logged out");
        res.redirect("/listing")
    })
})

module.exports = router;
