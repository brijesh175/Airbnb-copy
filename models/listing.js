const express = require("express");
const mongoose = require("mongoose");
const review = require('./review.js')
const Schema = mongoose.Schema;

const listingSchema = new Schema({
    title: {
        type: String,
        required: true,
    },
    description: String,
    image: {
        filename: String,
        url: {
            type: String,
            default: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQVC8jngnWMbM9Xc4Nvf-lDhb5W5hzpPQvRB4F6pQDYPg&s=10",
        },
    },
    price: Number,
    location: String,
    country: String,
    reviews : [
        {
            type:Schema.Types.ObjectId,
            ref: "review",
        }
    ]
})

listingSchema.post("findOneAndDelete" , async( Listing )=>{
    if(Listing){
        await review.deleteMany({_id : {$in: Listing.reviews}})
    }
})

const Listing = mongoose.model("Listing", listingSchema);
module.exports = Listing;
