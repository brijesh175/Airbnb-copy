const Listing = require("../models/listing.js")
const review = require("../models/review.js");
const mongoose = require("mongoose");

module.exports.postreview = async (req, res) => {
    if (!mongoose.isValidObjectId(req.params.id)) {
        req.flash("err", "You entered a wrong listing URL.");
        return res.redirect("/listing");
    }
    let listing = await Listing.findById(req.params.id);
    if (!listing) {
        req.flash("err", "This listing is not available.");
        return res.redirect("/listing");
    }
    let newreview = new review(req.body.review)
    newreview.author = req.user._id;
    listing.reviews.push(newreview);
    await newreview.save();
    await listing.save();

    req.flash("success" , "new review created")
    res.redirect(`/listing/${listing._id}`)
}

module.exports.deletereview = async (req , res) =>{
    let {id , reviewId} = req.params;
    await Listing.findByIdAndUpdate(id, { $pull: { reviews: reviewId } });
    await review.findByIdAndDelete(reviewId);
    req.flash("del" , "review deleted")
    res.redirect(`/listing/${id}`)
}
