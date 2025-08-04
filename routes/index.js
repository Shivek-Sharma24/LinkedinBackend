var express = require("express");
var router = express.Router();
const userModel = require("./users");
// const passport = require('passport');
// const localStrategy = require('passport-local');
const upload = require("./multer");
const postModel = require("./posts");
// passport.use(new localStrategy(userModel.authenticate()));
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const dotenv = require("dotenv");
dotenv.config();
const secretKey = process.env.secretKey;

/* GET home page. */
router.get("/", function (req, res, next) {
  // res.render('index');
  res.send("Running Successfully");
});

// router.get('/register', function(req, res, next) {
//   res.render('register' , {nav:false});
// });

// router.get("/profile" , isLoggedIn, async function(req , res ){
//   let user = await userModel.findOne({username:req.session.passport.user}).populate("posts");

//   res.render("profile" , {user , nav:true , });
// })

router.get("/profile", Authmiddleware, async function (req, res) {
  try {
    let userEmail = req.user.email;
    let user = await userModel.findOne({ email: userEmail }).populate("posts");
    res.json({ user: user }).status(200);
    // res.render("profile" , {user , nav:true , });
  } catch (error) {
    res.json({ message: "error in profile" });
  }
});

// router.get("/feed" , isLoggedIn, async function(req , res ){
//   let user = await userModel.find({username:req.session.passport.user}).populate("posts");
//   let posts = await postModel.find().populate("user")

//   // let Alluser = await userModel.find();
//   //in which we can render all users posts on feed page
//   res.render("feed" , {user ,posts , nav:true});

// })
router.get("/fetchposts", Authmiddleware, async function (req, res) {
  try {
    let userEmail = req.user.email;
    let user = await userModel.find({ email: userEmail }).populate("posts");
    res.json({ posts: user });
  } catch (error) {
    res.json({ message: "error in feed page" });
  }
});

router.get("/feed", Authmiddleware, async function (req, res) {
  try {
    let userEmail = req.user.email;
    let user = await userModel.find({ email: userEmail }).populate("posts");
    let posts = await postModel.find().populate("user");
    res.json({ posts: posts }).status(200);
    // let Alluser = await userModel.find();
    //in which we can render all users posts on feed page
    // res.render("feed" , {user ,posts , nav:true});
  } catch (error) {
    res.json({ message: "error in feed page" });
  }
});

// router.post("/createpost" , isLoggedIn, upload.single("postimage"), async function(req , res ){
//   let user = await userModel.findOne({username:req.session.passport.user})

//  const post =   await postModel.create({
//   user:user._id,
//   title:req.body.title ,
//   description:req.body.description,
//   postimage:req.file.filename
// })
//   user.posts.push(post._id);
//   await user.save()
//   res.redirect("/profile")

// });
router.post(
  "/createpost",
  Authmiddleware,
  upload.single("postimage"),
  async function (req, res) {
    try {
      let userEmail = req.user.email;
      let user = await userModel.findOne({ email: userEmail });
      console.log(req.body);
      console.log(req.file);
      const post = await postModel.create({
        user: user._id,
        title: req.body.title,
        description: req.body.description,
        postimage: req.file.filename,
      });
      user.posts.push(post._id);
      await user.save();
      res.json({Message:"Post Created Successfully"})
    } catch (error) {
      res.json({ message: "error while creating post", error: error });
    }

    // res.redirect("/profile")
  }
);

// router.get("/add" , isLoggedIn, async function(req , res ){
//   let user = await userModel.findOne({username:req.session.passport.user});
//   res.render("add" , {user , nav:true});
// })
// router.get("/add" , Authmiddleware, async function(req , res ){
//   let userEmail = req.user.email
//   let user = await userModel.findOne({username:req.session.passport.user});
//   res.render("add" , {user , nav:true});
// })

router.delete("/delete/:id", async function (req, res) {
 try {
    const id = req.params.id;
    let response = await postModel.findByIdAndDelete(id);
    return res.json({message:"deleted Successfully"})  
  } catch (error) {
    return res.json({ error: "error while deleting  Favourites" });
  }

  // res.redirect("/profile");
});

router.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;
  console.log(req.body);
  try {
    if (!username || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const existingUser = await userModel.findOne({ email: email });
    if (existingUser) {
      return res.status(400).json({ error: "User Already Exist" });
    }

    bcrypt.genSalt(10, (err, salt) => {
      if (err) {
        return res.status(500).json({ error: "salt password error" });
      }
      bcrypt.hash(password, salt, async (err, hash) => {
        if (err) {
          return res.status(500).json({ error: "Hashing password error" });
        }
        try {
          let user = await userModel.create({
            username,
            email,
            password: hash,
          });
          const token = jwt.sign({ email }, secretKey);
          res.status(200).json({
            user: user,
            token: token,
            message: "user registered successfully",
          });
        } catch (error) {
          res.status(500).json({ error: "registration error" });
        }
      });
    });
  } catch (error) {
    res.status(400).json({ error: "user signup error" });
  }
});

// Login Route
router.post("/login", async (req, res) => {
  // console.log(req.header("Authorization")?.split(" ")[1]);
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }
    const LoginUser = await userModel.findOne({ email: email });
    if (!LoginUser) {
      return res.status(400).json({ error: "user not found" });
    }
    const isMatch = await bcrypt.compare(password, LoginUser.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid user and password" });
    }
    const token = jwt.sign({ email }, secretKey);
    return res
      .status(200)
      .json({ message: "Login successfully", token: token, user: LoginUser });
  } catch (error) {
    res.status(400).json({ error: "Login error" });
  }
});

// Middleware
async function Authmiddleware(req, res, next) {
  const token = req.header("Authorization")?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Access Denied" });
  }
  try {
    const decoded = jwt.verify(token, secretKey);
    req.user = decoded;
    next();
  } catch (error) {
    console.error("JWT Verification Error:", error.message);
    res.status(401).json({ error: "Invalid token" });
  }
}

// router.post('/register' ,function(req, res, next) {
//  let data =   new  userModel({
// username:req.body.username,
// name: req.body.name,
// email : req.body.email,
// // contact : req.body.contact,
//  });

//  userModel.register(data , req.body.password).then(function(){
//   passport.authenticate('local')(req , res , function(){
//     res.redirect("/profile");
//   })
//  })
// });

// router.post("/login" ,passport.authenticate("local", {
//   successRedirect: '/profile',
//   failureRedirect: '/',
//   failureFlash:true
// } ), function(req ,res ){
// });

// router.post('/fileupload' ,isLoggedIn ,upload.single("profileimage") ,  async function(req , res){
// let user = await userModel.findOne({username:req.session.passport.user});
// user.profileimage = req.file.filename;
// await user.save();
// res.redirect("/profile");
// })
router.post(
  "/fileupload",
  Authmiddleware,
  upload.single("profileimage"),
  async function (req, res) {
    console.log(req.file)
    try {
      let userEmail = req.user.email;
      let user = await userModel.findOne({ email: userEmail });
      user.profileimage = req.file.filename;
      await user.save();
      res.json({ message: "file upload successfully" , user:user});
    } catch (error) {
      res.json({ error: "error while uploading file" });
    }

    // res.redirect("/profile");
  }
);
router.get("/getuser" , Authmiddleware, async function (req,res){
try {
      let userEmail = req.user.email;
      let user = await userModel.findOne({ email: userEmail });
      res.json({user:user});
}catch(error){
res.json({error:"Failed to Fetch user"})
}
})
// router.get('/logout', function(req, res, next){
//     req.logout(function(err) {
//       if (err) { return next(err); }
//       res.redirect('/');
//     });
//   });

// function isLoggedIn(req , res , next){
//   if(req.isAuthenticated()){
//     return next()
//   };
//   res.redirect("/")
// }

module.exports = router;
