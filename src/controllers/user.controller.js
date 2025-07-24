import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import uploadOnCloudinary from "../utils/cloudinary.js"

const registerUser = asyncHandler( async (req, res) => {
  // get user details from frontend
  // validation - not empty 
  // check if user already exists by username or email
  // check for images, avatar
  // upload them on cloudinary 
  // check on cloudinary
  // create user object - create entry in db 
  // remove password and refreshtoken from returned response
  // check if user created
  // return response 

 const {email, fullname, password, username} = req.body
 console.log(`email : ${email}`);
 
 // basic checks 
 //  if (email === "") {
 //   throw new ApiError(400, "Email is required")
 //  }

 // advance checks
 if ([email, fullname, password, username].some((field) =>
    field.trim() === "")
 ) {
   throw new ApiError(400, "All fields are required")
 }

 // checking if user already exists 
 // $or: finds either by username or email
 const existingUser = User.findOne({ $or: [{ username }, { email }] })
 if (existingUser) {
  throw new ApiError(409, "User with this username or email already exists, try choosing another one!")
 }
 
 const avatarLocalPath = req.files?.avatar[0]?.path;
 const coverImageLocalPath = req.files?.coverImage[0]?.path;

 //check for avatar 
 if (!avatarLocalPath) {
  throw new ApiError(400, "Avatar file is required")
 }

// Uploading on cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

// Checking for avatar on cloudinary
if (!avatar) {
  throw new ApiError(400, "Avatar file is required")
}

// creating user
const user = await User.create({
  fullname,
  avatar : avatar.url,
  coverImage : coverImage?.url || "",
  email,
  password,
  username : username.toLowerCase()
})

// checking if user created and removing password and refreshToken field

const createdUser = User.findById(user._id).select("-password -refreshToken")

if (!createdUser) {
  throw new ApiError(500, "Something went wrong while registering the user!")
}

return res.status(201).json(
  new ApiResponse(200, createdUser, "User registered successfully!")
)

} )


export {registerUser}