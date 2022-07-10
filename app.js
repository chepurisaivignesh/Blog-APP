//jshint esversion:6
require('dotenv').config();
// const md5 = require('md5'); required for Level3
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require("mongoose-encryption"); Needed in Level2
// const bcrypt=require("bcrypt"); Used in Level4
// const saltRounds=10; Used in Level4
const session = require('express-session');
const passport=require("passport");
const passportLocalMongoose=require("passport-local-mongoose");//We are importing passport-local as it is just a dependency for passport-local-mongoose


const app = express();

app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

app.set("view engine","ejs");

///LEVEL5-config-part1-start
app.use(session({
    secret:process.env.SECRETFORL5,
    resave:false,
    saveUninitialized:false
}));
app.use(passport.initialize());
app.use(passport.session());
///LEVEL5-config-part1-end

//DB
mongoose.connect("mongodb://localhost:27017/userDB");

const userSchema= new mongoose.Schema({
    email:String,
    password:String
});

//Encryption for Level 2 Security not needed for Level 3
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

//LEVEL5-config-part2-start
userSchema.plugin(passportLocalMongoose);
//LEVEL5-config-part2-end

const User=mongoose.model("User",userSchema);

//LEVEL5-config-part3-start
passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());
//LEVEL5-config-part3-end

//DB INITIALIZING COMPLETED

app.get("/",function(req,res){
    res.render("home")
});
/////////////////////////
app.get("/login",function(req,res){
    res.render("login")
})
app.post("/login",function(req,res){
    // User.findOne({
    //     email:req.body.username
    //     },
    //     function(err,foundUser){
    //         if(!err){
    //             if (foundUser){
    //                 bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
    //                     if (result===true){
    //                         res.render("secrets");
    //                     }
    //                 });
    //             }
    //         }
    //     }
    //     )
    ////////LEVEL5 START/////////////////
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,function(err){
        if (err){
            console.log(err)
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
    })

});
////////////////////////////

app.get("/register",function(req,res){
    res.render("register")
})
app.post("/register",function(req,res){
    // bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
    //     const newUser=new User({
    //         email:req.body.username,
    //         password:hash   
    //     });
    //     newUser.save(function(err){
    //         if(err){
    //             console.log(err);
    //         }else{
    //             res.render("secrets");
    //         }
    //     });
    // });
    ////////LEVEL5 START/////////////////
    User.register({username:req.body.username}, req.body.password, function(err, user) {
        if (err) {
            console.log(err); 
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            })
        }
        });
});

////////////////////////////////

app.get("/secrets",function(req,res){
    if (req.isAuthenticated()){
        res.render("secrets");
    }else{
        res.redirect("/login");
    }
    
});

app.get("/logout",function(req,res){
   req.logout(function(err){if(err){console.log(err)}});
   res.redirect("/");
})
// app.get("/submit",function(req,res){
//     res.render("submit")
// })

app.listen(3000,function(){console.log("Server is running.")});