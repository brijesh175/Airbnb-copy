const express = require("express");
const { reviewSchema } = require("../schema.js");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js")
const review = require("../models/review.js");
const Listing = require("../models/listing.js")
const ExpressError = require("../utils/expressError.js");
    

const validateReview = (req, res , next) => {
    let { error } = reviewSchema.validate(req.body);
    // console.log(result)
    if (error) {
        let errMsg = error.details.map((el)=>el.message).join(',')
        throw new ExpressError(400, errMsg)
    }else{
        next()
    }
}
// REVIEWs
router.post('/', validateReview, wrapAsync(async (req, res) => {
    let listing = await Listing.findById(req.params.id);
    if (!listing) {
        throw new ExpressError(404, "Listing not found");
    }
    let newreview = new review(req.body.review)

    listing.reviews.push(newreview);
    await newreview.save();
    await listing.save();

    req.flash("success" , "new review created")
    res.redirect(`/listing/${listing._id}`)
}))

// delete review route
router.delete("/:reviewId" , wrapAsync(async (req , res) =>{
    let {id , reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await review.findByIdAndDelete(reviewId);
    req.flash("del" , "review deleted")
    res.redirect(`/listing/${id}`)
}))


module.exports = router;
