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

const GoogleStrategy = require( 'passport-google-oauth2' ).Strategy;//For Level6
const findOrCreate=require("mongoose-findorcreate");//For Level6

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
    password:String,
    googleId:String, //Only for google auth
    secret:String
});

//Encryption for Level 2 Security not needed for Level 3
// userSchema.plugin(encrypt,{secret:process.env.SECRET,encryptedFields:["password"]});

//LEVEL5-config-part2-start
userSchema.plugin(passportLocalMongoose);
//LEVEL5-config-part2-end
userSchema.plugin(findOrCreate);//For Level6

const User=mongoose.model("User",userSchema);

//LEVEL5-config-part3-start
passport.use(User.createStrategy());
// passport.serializeUser(User.serializeUser()); Only for local auth
// passport.deserializeUser(User.deserializeUser()); Only for local auth
//LEVEL5-config-part3-end

//LEVEL6 AND SERIALISTAIONG,DESERIALISATION FOR ALL CASES
passport.serializeUser(function(user, done) {
    done(null, user._id);
    // if you use Model.id as your idAttribute maybe you'd want
    // done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});
//LEVEL6 AND SERIALISTAIONG,DESERIALISATION FOR ALL CASES^^^

//LEVEL6 START
passport.use(new GoogleStrategy({
    clientID:     process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    passReqToCallback   : true
  },
  function(request, accessToken, refreshToken, profile, done) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return done(err, user);
    });
  }
));
//findOrCreate is not a mongoose function its a psuedo function and inorder to make it work we are using a 3rd party lib called mongoose-findorcreate


//DB INITIALIZING COMPLETED

app.get("/",function(req,res){
    res.render("home")
});
/////////////////////////
//FOR LEVEL6 ONLY
app.get("/auth/google",
passport.authenticate("google",{scope:["profile"]})
);

app.get( "/auth/google/secrets",
    passport.authenticate( 'google', {
        successRedirect: '/secrets',
        failureRedirect: '/login'
}));
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
    User.find({"secret":{$ne:null}},function(err,foundUsers){
        if (err){
            console.log(err);
        }else{
            if (foundUsers){
                res.render("secrets",{usersWithSecrets:foundUsers});
            }
        }
    })
    
});

app.get("/logout",function(req,res){
   req.logout(function(err){if(err){console.log(err)}});
   res.redirect("/");
});

app.get("/submit",function(req,res){
    if (req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});

app.post("/submit",function(req,res){
    const submittedSecret=req.body.secret;
    User.findById(req.user.id,function(err,foundUser){
        if (err){
            console.log(err)
        }else{
            if (foundUser){
                foundUser.secret=submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.listen(3000,function(){console.log("Server is running.")});