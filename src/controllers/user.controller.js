import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import uploadOnCloudinary from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"

const generateAccessandRefreshToken = async function (userID) {
    try {
        const user = await User.findById(userID)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        // add refresh token in DB and save
        user.refreshToken = refreshToken
        await user.save( {validateBeforeSave : false} )

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating tokens!")
    }

}
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

 console.log(req.body) 
 const {email, fullname, password, username} = req.body
 //console.log({ email, fullname, username, password }); 
 
 // basic checks 
 //  if (email === "") {
 //   throw new ApiError(400, "Email is required")
 //  }

 // advance checks
 if ([email, fullname, password, username].some((field) =>
    !field || field?.trim() === "")
 ) {
   throw new ApiError(400, "All fields are required")
 }

 // checking if user already exists 
 // $or: finds either by username or email
 const existingUser = await User.findOne({ $or: [{ username }, { email }] })
 if (existingUser) {
  throw new ApiError(409, "User with this username or email already exists, try choosing another one!")
 }
 
 // const avatarLocalPath = req.files?.avatar[0]?.path;
 // const coverImageLocalPath = req.files?.coverImage[0]?.path;
let avatarLocalPath;
if(req.files && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
	avatarLocalPath = req.files?.avatar[0]?.path;
}
 // checking for coverImage so it doesnt throw error in no coverImage case 
 let coverImageLocalPath;
 if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0) {
   coverImageLocalPath = req.files?.coverImage[0]?.path;
 }

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

const createdUser = await User.findById(user._id).select("-password -refreshToken")

if (!createdUser) {
  throw new ApiError(500, "Something went wrong while registering the user!")
}

return res.status(201).json(
  new ApiResponse(200, createdUser , "User registered successfully!")
)

} )

const loginUser = asyncHandler( async (req, res, next) => {
    // (req -> data)
    // find user in db via username or email
    // password check
    // if matched generate access and refresh token and send a response
    // else throw error
    
	// console.log(req.body);
	
    const {email, username, password} = req.body;

	console.log(`${email}, ${username}, ${password}`);
	

    if(!username && !email){
        throw new ApiError(400, "username or email is required!")
    }

    const user = await User.findOne({
        $or : [{ username }, { email }] 
    })

    if(!user){
        throw new ApiError(404, "User with this username doesn't exist!");
    }

    const isPasswordValid = await user.isPasswordCorrect(password); 

    if(!isPasswordValid){
        throw new ApiError(401, "Incorrect Password!");
    }

    const {accessToken, refreshToken} = await generateAccessandRefreshToken(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    // These options make the cookies unmodifiable in frontend.
    const options = {
        httpOnly : true,
        secure : true 
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(200, {
            user : loggedInUser, accessToken, refreshToken
        }, "User Logged in successfully!")
    )

} )

const logoutUser = asyncHandler( async (req, res) => {
	const userID = req.user._id;

	await User.findByIdAndUpdate(userID, {
		$set : { 
			refreshToken : undefined 
		}
		},
		{
			new : true // returns new updated value 
		}
	)

	const options = {
        httpOnly : true,
        secure : true 
    }

	return res
	.status(200)
	.clearCookie("accessToken", options)
	.clearCookie("refreshToken", options)
	.json(new ApiResponse(200, {}, "User Logged Out!"))

} )

const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken =  req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized access!")
    }

    try {
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    
        const user = await User.findById(decodedToken?._id);
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token!")
        }
    
        //checking if the token in DB and incoming is same 
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, "Refresh token is expired or used!")
        }
    
        const options = {
            httpOnly : true,
            secure : true
        }
    
        const {newAccessToken, newRefreshToken} = await generateAccessandRefreshToken(user?._id)
    
        res.status(200)
        .cookie("accessToken", newAccessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(200, {newAccessToken, newRefreshToken}, "Token refreshed successfully!")
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Something went wrong while refreshing tokens!")
    }

} )

export { registerUser, loginUser, logoutUser, refreshAccessToken }