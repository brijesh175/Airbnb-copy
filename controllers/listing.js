const Listing = require("../models/listing");;
const { router } = require("../routs/listing.js");
const wrapAsync = require("../utils/wrapAsync.js");
const mongoose = require("mongoose")


const DEFAULT_IMAGE_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVC8jngnWMbM9Xc4Nvf-lDhb5W5hzpPQvRB4F6pQDYPg&s=10";

const useDefaultImageWhenBlank = (listing) => {
    if (!listing.image?.url?.trim()) {
        listing.image = { url: DEFAULT_IMAGE_URL };
    }
};

module.exports.index = async (req, res) => {
    const listing = await Listing.find({})

    console.log("DATABASE:", mongoose.connection.name);
    console.log("LISTINGS FOUND:", listing.length);

    res.render("listing/index.ejs", { listing })
}

module.exports.renderNewform = (req, res) => {
    res.render("listing/new.ejs");
}

module.exports.createnew = wrapAsync(async (req, res, next) => {
    const listingData = { ...req.body.listing };
    if (req.file) {
        listingData.image = { url: req.file.path, filename: req.file.filename };
    }
    useDefaultImageWhenBlank(listingData);
    const newListing = new Listing(listingData)
    newListing.owner = req.user._id;
    await newListing.save();
    req.flash("success", "new listing created!")
    res.redirect('/listing')
})

module.exports.detailshow = wrapAsync(async (req, res) => {
    let { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
        req.flash("err", "You entered a wrong listing URL.");
        return res.redirect("/listing");
    }
    let place = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author"
            }
        })
        .populate("owner")
    if (!place) {
        req.flash("err", "This listing is not available.");
        return res.redirect("/listing");
    }

    res.render("listing/show.ejs", { place });
})

module.exports.edit = (async (req, res) => {
    let { id } = req.params;
    let place = await Listing.findById(id);
    res.render("listing/edit", { place })
})

module.exports.update = async (req, res) => {
    const { id } = req.params;
    const place = await Listing.findByIdAndUpdate(
        id,
        { ...req.body.listing },
        { runValidators: true, new: true }
    );
    if (!place) {
        req.flash("err", "This listing is not available.");
        return res.redirect("/listing");
    }
    if (req.file) {
        place.image = { url: req.file.path, filename: req.file.filename };
        await place.save();
    }
    req.flash("success", "Listing updated.");
    res.redirect(`/listing/${id}`);
};

module.exports.delete = async (req, res) => {
    let { id } = req.params;
    let deleted = await Listing.findByIdAndDelete(id)
    req.flash("del", "listing deleted")
    res.redirect("/listing")
}
