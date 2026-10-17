const Listing = require("./models/listing")
const Review = require("./models/review")
const mongoose = require("mongoose")
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
    if (!mongoose.isValidObjectId(id)) {
        req.flash("err", "You entered a wrong listing URL.");
        return res.redirect("/listing");
    }
    let listing = await Listing.findById(id)
    if (!listing) {
        req.flash("err", "This listing is not available.");
        return res.redirect("/listing");
    }
    if (!listing.owner || !listing.owner.equals(req.user._id)) {
        req.flash("err", "You don't have permission to change this listing.");
        return res.redirect(`/listing/${id}`)
    }
    next()
}
module.exports.isauthor = async(req, res, next) => {
    let {id, reviewId } = req.params;
    if (!mongoose.isValidObjectId(id) || !mongoose.isValidObjectId(reviewId)) {
        req.flash("err", "The listing or review URL is invalid.");
        return res.redirect("/listing");
    }
    let review = await Review.findById(reviewId)
    const listing = await Listing.findById(id);
    if (!review || !listing || !listing.reviews.some((savedReviewId) => savedReviewId.equals(review._id))) {
        req.flash("err", "This review is not available for that listing.");
        return res.redirect(`/listing/${id}`);
    }
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
