//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");

const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.set("view engine","ejs");

//DB
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema= new mongoose.Schema({
    email:String,
    password:String
});
//Encryption for Level 2 Security
const secret = "Thisisourlittlesecret";
userSchema.plugin(encrypt,{secret:secret,encryptedFields:["password"]});

const User=mongoose.model("User",userSchema);
//DB INITIALIZING COMPLETED

app.get("/",function(req,res){
    res.render("home")
});
/////////////////////////
app.get("/login",function(req,res){
    res.render("login")
})
app.post("/login",function(req,res){
    User.findOne({
        email:req.body.username
        },
        function(err,foundUser){
            if(!err){
                if(foundUser.password===req.body.password){
                    res.render("secrets");
                }
            }
        }
        )
});
////////////////////////////

app.get("/register",function(req,res){
    res.render("register")
})
app.post("/register",function(req,res){
    const newUser=new User({
        email:req.body.username,
        password:req.body.password
    });
    newUser.save(function(err){
        if(err){
            console.log(err);
        }else{
            res.render("secrets");
        }
    });
});
////////////////////////////////

// app.get("/secrets",function(req,res){
//     res.render("secrets")
// })
// app.get("/submit",function(req,res){
//     res.render("submit")
// })

app.listen(3000,function(){console.log("Server is running.")});