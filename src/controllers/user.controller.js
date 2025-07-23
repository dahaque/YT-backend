import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"

const registerUser = asyncHandler( async (req, res) => {
  // get user details from frontend
  // validation - not empty 
  // check if user already exists by username or email
  // check for images, avatar
  // upload them on cloudinary 
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


} )

export {registerUser}