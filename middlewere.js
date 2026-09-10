const Listing = require("./models/listing")
const Review = require("./models/review")
const { listingSchema, reviewSchema } = require("./schema.js");
const ExpressError = require("./utils/expressError.js");

module.exports.isloggedIn = ((req, res, next) => {
    if (!(req.isAuthenticated())) {
        req.session.redirectUrl = req.originalUrl;
        req.flash('err', "You must log in first.")
        return res.redirect('/login')
    }
    next()
})

module.exports.saveRedirectUrl = ((req, res, next) => {             // this is middlewewr which save url where req come from and after login it redirect to it
    if (req.session.redirectUrl) {
        res.locals.redirectUrl = req.session.redirectUrl;
    }
    next()
})

module.exports.isOwner = async(req, res, next) => {
    let { id } = req.params;
    let listing = await Listing.findById(id)
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("err", "You don't have permission to change this listing.");
        return res.redirect(`/listing/${id}`)
    }
    next()
}
module.exports.isauthor = async(req, res, next) => {
    let {id, reviewId } = req.params;
    let review = await Review.findById(reviewId)
    if (!review.author.equals(res.locals.curruser._id)) {
        req.flash("err", "this review is not created by you");
        return res.redirect(`/listing/${id}`)
    }
    next()
}

module.exports.validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    // console.log(result)
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(',')
        throw new ExpressError(400, errMsg)
    } else {
        next()
    }
}
module.exports.validateReview = (req, res , next) => {
    let { error } = reviewSchema.validate(req.body);   
    // console.log(result)
    if (error) {
        let errMsg = error.details.map((el)=>el.message).join(',')
        throw new ExpressError(400, errMsg)
    }else{
        next()
    }
}
