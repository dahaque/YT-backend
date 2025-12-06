import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true //makes it more searchable
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    fullname: {
      type: String,
      required: true,
      trim: true,
      index: true
    },
    avatar: {
      type: String, // cloudinary
      required: true
    },
    coverImage: {
      type: String, // cloudinary
    },
    watchHistory: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Video"
      }
    ],
    password: {
      type: String,
      required: [true, "password is required"]
    },
    refreshToken: {
      type: String
    },
    token: {
      type: String,
      default: ''
    }
  }, { timestamps: true })

 // encryption takes times that's why async function 
userSchema.pre("save", async function(next){
  if(this.isModified("password")){
    this.password = await bcrypt.hash(this.password, 10)
  }
  next();
})

// injecting methods in userSchema 
userSchema.methods.isPasswordCorrect = async function(password){
 return await bcrypt.compare(password, this.password); // returns a boolean
}

userSchema.methods.generateAccessToken = function(){
 return jwt.sign(
    {
      _id : this._id,
      username : this.username,
      email : this.email,
      fullname : this.fullname
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn : process.env.ACCESS_TOKEN_EXPIRY
    }

  )
}

userSchema.methods.generateRefreshToken = function(){
 return jwt.sign(
    {
      _id : this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn : process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = mongoose.model("User", userSchema)