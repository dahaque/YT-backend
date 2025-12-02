import mongoose, {isValidObjectId} from "mongoose";
import {Video} from "../models/video.model.js";
import {User} from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllVideo = asyncHandler(async(req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;


})

const publishAVideo = asyncHandler( async(req, res) => {
    const { title, description} = req.body;

    if(!title){
        throw new ApiError(401, "Enter a valid title!")
    }
    console.log(title);
    
    console.log(description);
    
    if(!description){
        throw new ApiError(401, "Enter a valid description!")
    }

    const VideoFileLocalPath = req.files?.videoFile[0]?.path

    if(!VideoFileLocalPath){
        throw new ApiError(401, "No video found!")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!thumbnailLocalPath){
        throw new ApiError(401, "Enter a valid thumbnail!")
    }

    const videoFile = await uploadOnCloudinary(VideoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.create({
        videoFile :  videoFile.url,
        thumbnail : thumbnail.url,
        title,
        description,
        duration : videoFile.duration,
        views : 0,
        isPublished : true,
        owner : req.user?._id
    })
    
    if(!video){
        throw new ApiError(400, "Video Upload failed!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, video, "video file uploaded successfully")
    )

} )

export {
    getAllVideo,
    publishAVideo
}