const express = require("express");
const mongoose = require("mongoose");
const path = require('path')
const methodOverride = require('method-override');
const ejsMat = require("ejs-mate");
const ExpressError = require("./utils/expressError.js");

const listing = require("./routs/listing.js")
const revi = require("./routs/reviews.js")

const app = express();
app.set("view engine", 'ejs')
app.set("views", path.join(__dirname, 'views'))
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride("_method"));
app.engine('ejs', ejsMat);
app.use(express.static(path.join(__dirname, "/public")));

main().then(() => console.log('DB working'))
    .catch(err => console.log(err));

async function main() {
    await mongoose.connect('mongodb://127.0.0.1:27017/wanderlust');
}

app.get("/" , (req,res)=>{
    res.redirect("/listing")
})

app.use("/listing" , listing);
app.use("/listing/:id/reviews" , revi);

app.all("/{*splat}", (req, res, next) => {
    next(new ExpressError(404, 'page not found!!!'))
})

//CUSTOM ERROR HANDALING
// app.use((err, req, res, next) => {
//     let { statusCode = 500, message = 'something is wrong from defauly' } = err;
//     res.status(statusCode).send(message);
// })

app.listen("8080", () => {
    console.log("server is listing to 8080")
})
