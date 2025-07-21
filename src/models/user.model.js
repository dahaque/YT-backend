import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema(
  {
    username : {
      type : String,
      required : true,
      unique : true,
      lowercase : true,
      trim : true,
      index : true //makes it more searchable
    },
    email : {
      type : String,
      required : true,
      unique : true,
      lowercase : true,
      trim : true,
    },
    fullname : {
      type : String,
      required : true,
      trim : true,
      index : true
    },
    avatar : {
      type : String, // cloudinary
      required : true
    },
    coverImage : {
      type : String, // cloudinary
    },
    watchHistory : [
      {
        type : mongoose.Schema.Types.ObjectId,
        ref : "Video"
      }
    ],
    password : {
      type : String,
      required : [true, "password is required"]
    },
    refreshToken : {
      type : String
    }
  }, {timestamps : true})

 // encryption takes times that's why async function 
userSchema.pre("save", async function(next){
  if(this.isModified("password")){
    this.password = bcrypt.hash(this.password, 10)
  }
  next();
})

userSchema.method.isPasswordCorrect = async function(password){
 return await bcrypt.compare(password, this.password); // returns a boolean
}

export const User = mongoose.model("User", userSchema)