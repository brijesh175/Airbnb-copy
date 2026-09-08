const express = require("express")
// const cookieParser = require('cookie-parser')
const session = require('express-session')

const app = express();

// app.use(cookieParser())

// app.get("/getcookis" , (req,res)=>{
//     res.cookie("name" , "brijesh")
//     res.cookie("age" , "20")
//     res.cookie("school" , "jnv")
//     res.cookie("clg" , "ssit")
//     res.send("you migt get some cookis")
// })

app.use(session({
  secret: 'keyboard cat',
  resave: false,
  saveUninitialized: true,
}))

app.get('/reqcount' , (req,res)=>{
  if(req.session.views){
    req.session.views++;
  }else{
    req.session.views = 1;
  }
  res.send(`you send request ${req.session.views} times`)
})

// app.get('/', function (req, res) {
//   res.send('this is working')
// })

app.listen(8080 , ()=>{
    console.log(`this classroom is working on 3000`)
})