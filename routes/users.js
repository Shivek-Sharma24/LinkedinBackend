
const mongoose = require("mongoose");
mongoose.connect("mongodb://127.0.0.1:27017/finalpinterest");

const plm = require("passport-local-mongoose");

const userSchema = mongoose.Schema({
username:String,
name: String,
email : String,
contact : Number,
password:String , 
profileimage : String, 

posts :[{
  type:mongoose.Schema.Types.ObjectId , 
  ref : 'posts'
}]
})

userSchema.plugin(plm);

module.exports = mongoose.model('user' , userSchema);