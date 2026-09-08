module.exports.isloggedIn = ((req, res, next) => {
    if (!(req.isAuthenticated())) {
        req.session.redirectUrl = req.originalUrl;
        req.flash('err', "You must log in first.")
        return res.redirect('/login')
    }
    next()
})

module.exports.saveRedirectUrl = ((req, res, next) => {             // this is middlewewr which save url where req come from and after login it redirect to it
    if(req.session.redirectUrl){    
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next()
})
