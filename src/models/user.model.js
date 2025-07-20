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

export const User = mongoose.model("User", userSchema)