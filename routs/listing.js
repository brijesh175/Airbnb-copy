const express = require("express")
const router = express.Router();
const wrapAsync = require("../utils/wrapAsync.js")

const {isloggedIn , isOwner , validateListing} = require("../middlewere.js")
const multer  = require('multer')
const {storage} = require("../cloudConfig.js")
const upload = multer({ storage })

const listingController = require("../controllers/listing")



//index route 
router.route("/")
    .get(wrapAsync(listingController.index))
    .post(
        isloggedIn,
        upload.single("listing[image]"),
        validateListing,
        listingController.createnew
    )
//create new route
router.get("/new",isloggedIn, listingController.renderNewform)

//show route
router.get('/:id', listingController.detailshow)

//edit route
router.get("/:id/edit", isloggedIn,isOwner,wrapAsync(listingController.edit))

//update route
router.put("/:id", isloggedIn, isOwner, upload.single("listing[image]"), validateListing, wrapAsync(listingController.update))

// delete post route route
router.delete("/:id/",isloggedIn,isOwner, wrapAsync(listingController.delete))



module.exports = router;
