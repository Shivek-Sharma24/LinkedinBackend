const mongoose = require("mongoose");
const dotenv = require("dotenv");
dotenv.config();
mongoose
  .connect(process.env.mongodb_url)
  .then(() => {
    console.log("Database connected successfully");
  })
  .catch((err) => {
    console.log("Databse Errror", err);
  });
// MongoDB_Url= mongodb+srv://shivek_24:shiveksharma8755@shivek.6yh3v.mongodb.net/FoodReceipe
// secretKey = Shivekrecipe24

// const plm = require("passport-local-mongoose");

const userSchema = mongoose.Schema({
  username: String,
  // name: String,
  email: String,
  // contact : Number,
  password: String,
  profileimage: String,

  posts: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: "posts",
    },
  ],
});

// userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
