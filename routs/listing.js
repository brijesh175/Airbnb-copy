const express = require("express")
const mongoose = require("mongoose")
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js")
const Listing = require("../models/listing.js")
const ExpressError = require("../utils/expressError.js")
const { listingSchema } = require("../schema.js")
const {isloggedIn} = require("../middlewere.js")

const DEFAULT_IMAGE_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVC8jngnWMbM9Xc4Nvf-lDhb5W5hzpPQvRB4F6pQDYPg&s=10";

const useDefaultImageWhenBlank = (listing) => {
    if (!listing.image?.url?.trim()) {
        listing.image = { url: DEFAULT_IMAGE_URL };
    }
};

const validateListing = (req, res, next) => {
    let { error } = listingSchema.validate(req.body);
    // console.log(result)
    if (error) {
        let errMsg = error.details.map((el) => el.message).join(',')
        throw new ExpressError(400, errMsg)
    } else {
        next()
    }
}


//index route
router.get("/", wrapAsync(async (req, res) => {
    const listing = await Listing.find({})
    res.render("listing/index.ejs", { listing })
}))

//create new route
router.get("/new",isloggedIn, (req, res) => {

    res.render("listing/new.ejs");
})

//create route
router.post("/", validateListing, wrapAsync(async (req, res, next) => {
    // let {title , description , image , price , country , location} = req.body;

    useDefaultImageWhenBlank(req.body.listing);
    const newListing = new Listing(req.body.listing)
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "new listing created!")
    res.redirect('/listing')
}))

//show route
router.get('/:id',isloggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("err", "You entered a wrong listing URL.");
        return res.redirect("/listing");
    }

    let place = await Listing.findById(id).populate("reviews").populate("owner")
    if (!place) {
        req.flash("err", "This listing is not available.");
        return res.redirect("/listing");
    }
    console.log(place)
    res.render("listing/show.ejs", { place });
}))

//edit route
router.get("/:id/edit", isloggedIn,wrapAsync(async (req, res) => {
    let { id } = req.params;
    let place = await Listing.findById(id);
    res.render("listing/edit", { place })
}))

//update route
router.put("/:id",isloggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;
    useDefaultImageWhenBlank(req.body.listing);
    await Listing.findByIdAndUpdate(id, { ...req.body.listing })
    res.redirect(`/listing`)
}))

// delete post route route
router.delete("/:id/",isloggedIn, wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deleted = await Listing.findByIdAndDelete(id)
    req.flash("del", "listing deleted")
    res.redirect("/listing")
}))



module.exports = router;
