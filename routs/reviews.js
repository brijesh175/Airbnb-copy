const express = require("express");
const { reviewSchema } = require("../schema.js");
const router = express.Router({ mergeParams: true });
const wrapAsync = require("../utils/wrapAsync.js")
// const review = require("../models/review.js");
// const Listing = require("../models/listing.js")
const ExpressError = require("../utils/expressError.js");
const {validateReview , isloggedIn , isauthor} = require("../middlewere.js")
const reviewController = require("../controllers/review")


// Post  REVIEWs route
router.post('/', isloggedIn,  validateReview, wrapAsync(reviewController.postreview))

// delete review route
router.delete("/:reviewId" ,isloggedIn,isauthor, wrapAsync(reviewController.deletereview))


module.exports = router;
