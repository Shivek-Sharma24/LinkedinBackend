var express = require('express');
var router = express.Router();
const userModel = require("./users");
const passport = require('passport');
const localStrategy = require('passport-local');
const upload = require("./multer");
const postModel = require("./posts");
passport.use(new localStrategy(userModel.authenticate()));


/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index' , {error:req.flash("error"),nav:false});
});

router.get('/register', function(req, res, next) {
  res.render('register' , {nav:false});
});

router.get("/profile" , isLoggedIn, async function(req , res ){
  let user = await userModel.findOne({username:req.session.passport.user}).populate("posts");
  
  res.render("profile" , {user , nav:true , });
})

router.get("/feed" , isLoggedIn, async function(req , res ){
  let user = await userModel.find({username:req.session.passport.user}).populate("posts");
  let posts = await postModel.find().populate("user")

  // let Alluser = await userModel.find();
  //in which we can render all users posts on feed page
  res.render("feed" , {user ,posts , nav:true});
  
 
})


router.post("/createpost" , isLoggedIn, upload.single("postimage"), async function(req , res ){
  let user = await userModel.findOne({username:req.session.passport.user})

 const post =   await postModel.create({
  user:user._id,
  title:req.body.title , 
  description:req.body.description,
  postimage:req.file.filename
})
  user.posts.push(post._id);
  await user.save()
  res.redirect("/profile")
 
});



router.get("/add" , isLoggedIn, async function(req , res ){
  let user = await userModel.findOne({username:req.session.passport.user});
  res.render("add" , {user , nav:true});
})

router.get("/delete/:id" ,async function(req,res){
   await postModel.findOneAndDelete({_id:req.params.id});
  
  res.redirect("/profile");
})


router.post('/register' ,function(req, res, next) {
 let data =   new  userModel({
username:req.body.username,
name: req.body.name,
email : req.body.email,
contact : req.body.contact, 
 });

 userModel.register(data , req.body.password).then(function(){
  passport.authenticate('local')(req , res , function(){
    res.redirect("/profile");
  })
 })
});

router.post("/login" ,passport.authenticate("local", {
  successRedirect: '/profile',
  failureRedirect: '/',
  failureFlash:true
} ), function(req ,res ){
});

router.post('/fileupload' ,isLoggedIn ,upload.single("profileimage") ,  async function(req , res){
let user = await userModel.findOne({username:req.session.passport.user});
user.profileimage = req.file.filename;
await user.save();
res.redirect("/profile");
})

router.get('/logout', function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    });
  });




function isLoggedIn(req , res , next){
  if(req.isAuthenticated()){
    return next()
  };
  res.redirect("/")
}


module.exports = router;
