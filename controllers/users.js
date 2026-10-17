const User = require("../models/user.js")

module.exports.signUppage = async (req, res, next) => {

    try {
        let { username, email, password, age } = req.body;
        const newUser = new User({ email, username, age });
        const regusr = await User.register(newUser, password);
        req.login(regusr, (err) => {
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
}
module.exports.loginpage = async (req, res) => {
    res.render('./users/login.ejs')
}
module.exports.logincheck =  async (req, res) => {

    req.flash("success", "welcome back to our website")
    res.redirect(res.locals.redirectUrl || "/listing");         //listing for if you login directly from login btn and there is no any redirect url
}


module.exports.logout = (req, res, next) => {
    req.logOut((err) => {
        if (err) {
            return next(err);
        }
        req.flash("success", "thik chhe you ar logged out");
        res.redirect("/listing")
    })
}
