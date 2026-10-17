const express = require("express");
const router = express.Router();
const User = require("../models/user.js")
const wrapAsync = require("../utils/wrapAsync.js");
const passport = require("passport");
const { saveRedirectUrl } = require("../middlewere.js")
const userController = require("../controllers/users")

router.get("/signup", (req, res) => {
    res.render('./users/signup.ejs')
})

router.post("/signup", wrapAsync(userController.signUppage))

router.get("/login", userController.loginpage)

router.post("/login", saveRedirectUrl, passport.authenticate("local", { failureRedirect: "/login", failureFlash: true }) , userController.logincheck)

router.get("/logout",userController.logout)

module.exports = router;
