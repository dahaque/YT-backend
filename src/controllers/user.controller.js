import { asyncHandler } from "../utils/asyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.model.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import {uploadOnCloudinary,  deleteFromCloudinary } from "../utils/cloudinary.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"
import { deleteLocalFile } from "../utils/deleteLocalFile.js"

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
console.log(avatarLocalPath);

 //check for avatar 
 if (!avatarLocalPath) {
  throw new ApiError(400, "Avatar file is required")
 }

// Uploading on cloudinary
const avatar = await uploadOnCloudinary(avatarLocalPath)
const coverImage = await uploadOnCloudinary(coverImageLocalPath)

console.log(avatar);

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
		$unset : { 
			refreshToken : 1 
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
    const incomingRefreshToken =  req.cookies?.refreshToken || req.body.refreshToken;

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

const changePassword = asyncHandler( async (req, res) => {
    
    const {oldPassword, newPassword, confirmPassword} = req.body;

    if(newPassword !== confirmPassword){
        throw new ApiError(400,"Passwords do not match");
    }

    const user = await User.findById(req.user?._id);

    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid password")
    }

    user.password = newPassword;
    await user.save({validateBeforeSave : false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, "Password changed!")
    )
}) 

const getCurrentuser = asyncHandler( async (req, res) => {
    return res
    .status(200)
    .json(
        new ApiResponse(200, req.user, "Current user fetched!")
    )
} )

const updateAccountDetails = asyncHandler( async(req, res) => {

    const {fullname, email} = req.body;

    if (!fullname && !email) {
        throw new ApiError(400, "All fields are reqired!")
    }

    const user = User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname : fullname,
                email : email //We can write this or direct "email" both is same
            }
        },
        {
            new : true // returns newly saved info 
        }
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully!"))
} )

const updateUserAvatar = asyncHandler( async(req, res) => {
    
    const newAvatarLocalpath = req.file?.path
    //const oldAvatarlocalpath = req.file?.path

    if (!newAvatarLocalpath) {
        throw new ApiError(401, "Avatar is needed!")
    }

    const avatar = await uploadOnCloudinary(newAvatarLocalpath);

    if (!avatar.url) {
        throw new ApiError(401, "upload on cloudinary failed!")
    }

    const userData = await User.findById(req.user?._id).select("avatar public_id")

    const oldAvatarlocalpath = userData?.public_id

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar : avatar.url
            }
        },
        {
            new : true
        }
    ).select("-password -refreshToken")

    if(oldAvatarlocalpath){
        await deleteFromCloudinary(oldAvatarlocalpath);
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, user.avatar, "avatar updated successfully!")
    )

} )

const updateUserCoverImage = asyncHandler( async(req, res) => {
    
    const newCoverImageLocalpath = req.file?.path

    if (!newCoverImageLocalpath) {
        throw new ApiError(401, "Cover Image is needed!")
    }

    const coverImage = await uploadOnCloudinary(newCoverImageLocalpath);

    if (!coverImage.url) {
        throw new ApiError(401, "upload on cloudinary failed!")
    }
    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage : coverImage.url
            }
        },
        {
            new : true
        }
    ).select("-password -refreshToken")

    return res
    .status(200)
    .json(
        new ApiResponse(200, user.coverImage, "Cover image updated successfully!")
    )

} )

const getUserChannelProfile = asyncHandler ( async (req, res) => {
    const {username} = req.params

    if (!username?.trim()) {
        throw new ApiError(400, "Username is missing!")
    }

    const channel = await User.aggregate([
        {
            $match : {
                username : username?.toLowerCase()
            }
        }, 
        {
            $lookup : {
                from : "subscriptions", // "Subscription" model is represented as "subscriptions" in DB
                localField : "_id",
                foreignField : "channel",
                as : "subscribers"
            }
        },
        {
            $lookup : {
                from : "subscriptions",
                localField : "_id",
                foreignField : "subscriber",
                as : "subscribedTo"
            }
        },
        {
            $addFields : {
                subscribersCount : {
                    $size : "$subscribers" // count all the subscribers fields
                },
                channelsSubscribedToCount : {
                    $size : "$subscribedTo"
                },
                isSubsribed : {
                    $cond : {
                        if : {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then : true,
                        else : false
                    }
                }
            }
        },
        {
            $project : {
                fullname : 1,
                username : 1,
                avatar : 1,
                coverImage: 1,
                subscribersCount : 1,
                channelsSubscribedToCount : 1,
                isSubsribed : 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(404, "channel does not exist!")
    }

    return res
    .status(200)
    .json(new ApiResponse(400, channel[0], "channel profile fetched succesfully!"))

} )

const getWatchHistory = asyncHandler( async (req, res) => {
    
    const user = await User.aggregate([
        {
            $match : {
                _id : new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup : {
                from : "videos",
                localField : "watchHistory",
                foreignField : "_id",
                as : "watchHistory",
                pipeline : [
                    {
                        $lookup :{
                            from : "users",
                            localField : "owner",
                            foreignField : "_id",
                            as : "videoOwner",
                            pipeline : [
                                {
                                    $project : {
                                        fullname : 1,
                                        username : 1,
                                        avatar : 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields : {
                            videoOwner : {
                                $first : "$videoOwner" // only sending the first value of the array returned.
                            }
                        }
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, user[0].watchHistory, "Watch history fetched!"))
} )

export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changePassword,
    getCurrentuser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}