const mongoose = require("mongoose");
const initData = require("./data.js");
const Listing = require("../models/listing.js");

const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
    .then(() => {
        console.log("connected to DB");
    })
    .catch((err) => {
        console.log("Connection Error:", err.message);
        console.log(err);
    });


const initDB = async () => {
    await Listing.deleteMany({});
    initData.data = initData.data.map((obj)=>({...obj , owner : "6a9c3589640372d8b7220737"}))           // add new user
    await Listing.insertMany(initData.data);
    console.log("data was initialized");
};

async function main() {
    await mongoose.connect(MONGO_URL);
   await initDB();
}


