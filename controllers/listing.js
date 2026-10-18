const Listing = require("../models/listing");
const mongoose = require("mongoose");
const wrapAsync = require("../utils/wrapAsync.js");


const DEFAULT_IMAGE_URL = "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVC8jngnWMbM9Xc4Nvf-lDhb5W5hzpPQvRB4F6pQDYPg&s=10";

// SECURITY: Escapes special characters in regular expressions (e.g. *, +, ?, ^, $, (, ), [, ]).
// Without this, searching for characters like "(" would crash the server with a SyntaxError,
// or allow attackers to craft malicious patterns (Regular Expression Denial of Service - ReDoS).
const escapeRegex = (str) => {
    return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

// SECURITY & VALIDATION: Whitelist of allowed sort options.
// Never pass raw user input directly to MongoDB's .sort() method.
// If an attacker sends ?sort[password]=1 or an invalid field, the whitelist safely rejects it.
const SORT_OPTIONS = {
    recommended: { _id: -1 },             // Default: chronological order by MongoDB ObjectId
    price_asc: { price: 1, _id: -1 },     // Price low to high, with _id as tiebreaker
    price_desc: { price: -1, _id: -1 },   // Price high to low, with _id as tiebreaker
    newest: { createdAt: -1, _id: -1 },   // Newest first using timestamp or _id
};

const useDefaultImageWhenBlank = (listing) => {
    if (!listing.image?.url?.trim()) {
        listing.image = { url: DEFAULT_IMAGE_URL };
    }
};

module.exports.index = async (req, res) => {
    // 1. EXTRACT & SANITIZE INPUTS:
    // Ensure all inputs are strings and trim whitespace so "  Malibu  " searches for "Malibu".
    const rawSearch = typeof req.query.search === 'string' ? req.query.search : (typeof req.query.q === 'string' ? req.query.q : '');
    const searchQuery = rawSearch.trim();

    const rawLocation = typeof req.query.location === 'string' ? req.query.location : '';
    const locationQuery = rawLocation.trim();

    const rawCountry = typeof req.query.country === 'string' ? req.query.country : '';
    const countryQuery = rawCountry.trim();

    const rawMinPrice = typeof req.query.minPrice === 'string' ? req.query.minPrice.trim() : '';
    const rawMaxPrice = typeof req.query.maxPrice === 'string' ? req.query.maxPrice.trim() : '';

    // Verify sort against our whitelist; fallback to 'recommended' if missing or malicious.
    const rawSort = typeof req.query.sort === 'string' ? req.query.sort.trim().toLowerCase() : 'recommended';
    const sortKey = Object.prototype.hasOwnProperty.call(SORT_OPTIONS, rawSort) ? rawSort : 'recommended';
    const sortOrder = SORT_OPTIONS[sortKey];

    const filterConditions = [];
    let priceWarning = null;

    // 2. TEXT SEARCH ($or across title, location, country):
    // Partial, case-insensitive match ('i' flag) so "beach" matches "Beachfront Cottage".
    if (searchQuery) {
        const safeSearchRegex = new RegExp(escapeRegex(searchQuery), 'i');
        filterConditions.push({
            $or: [
                { title: { $regex: safeSearchRegex } },
                { location: { $regex: safeSearchRegex } },
                { country: { $regex: safeSearchRegex } },
            ]
        });
    }

    // 3. LOCATION & COUNTRY FILTERS:
    if (locationQuery) {
        const safeLocRegex = new RegExp(escapeRegex(locationQuery), 'i');
        filterConditions.push({
            $or: [
                { location: { $regex: safeLocRegex } },
                { country: { $regex: safeLocRegex } }
            ]
        });
    }

    if (countryQuery) {
        const safeCountryRegex = new RegExp(`^${escapeRegex(countryQuery)}$`, 'i');
        filterConditions.push({ country: { $regex: safeCountryRegex } });
    }

    // 4. PRICE RANGE VALIDATION:
    // Convert strings to Numbers and reject negative values or non-numeric garbage (e.g. "abc").
    let minPriceNum = null;
    let maxPriceNum = null;

    if (rawMinPrice !== '') {
        const parsed = Number(rawMinPrice);
        if (!isNaN(parsed) && parsed >= 0) {
            minPriceNum = parsed;
        } else {
            priceWarning = "Minimum price must be a valid non-negative number.";
        }
    }

    if (rawMaxPrice !== '') {
        const parsed = Number(rawMaxPrice);
        if (!isNaN(parsed) && parsed >= 0) {
            maxPriceNum = parsed;
        } else {
            priceWarning = priceWarning
                ? `${priceWarning} Maximum price must be a valid non-negative number.`
                : "Maximum price must be a valid non-negative number.";
        }
    }

    // EDGE CASE: If user enters minPrice: 2000 and maxPrice: 1000, swap them
    // and provide feedback instead of returning an impossible zero-result query.
    if (minPriceNum !== null && maxPriceNum !== null && minPriceNum > maxPriceNum) {
        priceWarning = `Minimum price (₹${minPriceNum}) was greater than maximum price (₹${maxPriceNum}). Range was adjusted to ₹${maxPriceNum} - ₹${minPriceNum} to display matching listings.`;
        const temp = minPriceNum;
        minPriceNum = maxPriceNum;
        maxPriceNum = temp;
    }

    if (minPriceNum !== null || maxPriceNum !== null) {
        const priceCriteria = {};
        if (minPriceNum !== null) priceCriteria.$gte = minPriceNum;
        if (maxPriceNum !== null) priceCriteria.$lte = maxPriceNum;
        filterConditions.push({ price: priceCriteria });
    }

    // 5. ASSEMBLE MONGOOSE QUERY:
    // If multiple filters exist, combine them with $and so all conditions must be met.
    const mongoQuery = filterConditions.length === 0
        ? {}
        : (filterConditions.length === 1 ? filterConditions[0] : { $and: filterConditions });

    // 6. EXECUTE QUERIES IN PARALLEL:
    // Promise.all runs the filtered search, total count, and distinct countries simultaneously.
    const [listing, totalCount, distinctCountries] = await Promise.all([
        Listing.find(mongoQuery).sort(sortOrder),
        Listing.countDocuments({}),
        Listing.distinct("country")
    ]);

    // Track active filter count to know when to show "Clear all" and badge chips.
    const activeFilterCount = (searchQuery ? 1 : 0) +
        (locationQuery ? 1 : 0) +
        (countryQuery ? 1 : 0) +
        (rawMinPrice !== '' ? 1 : 0) +
        (rawMaxPrice !== '' ? 1 : 0) +
        (sortKey !== 'recommended' ? 1 : 0);

    // 7. RENDER VIEW WITH STATE:
    // Passing back the 'filters' object allows input fields to remember what the user typed.
    res.render("listing/index.ejs", {
        listing,
        filters: {
            search: searchQuery,
            location: locationQuery,
            country: countryQuery,
            minPrice: rawMinPrice,
            maxPrice: rawMaxPrice,
            sort: sortKey
        },
        resultsCount: listing.length,
        totalCount,
        activeFilterCount,
        priceWarning,
        countries: (distinctCountries || []).filter(Boolean).sort()
    });
};

module.exports.renderNewform = (req, res) => {
    res.render("listing/new.ejs");
}

module.exports.createnew = async (req, res, next) => {
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
}

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
