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

const getVideoById = asyncHandler( async(req, res) => {
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(401, "Video ID is missing!")
    }

    const videoRes = await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        },
    },
        { new: true }
    )

    if(!videoRes){
        throw new ApiError(404, "Video isn't available")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoRes, "Video fetched successfully")
    )
} ) 

const updateVideo = asyncHandler( async(req, res) => {
    const { videoId } = req.params;

    if(!videoId){
        throw new ApiError(401, "Enter a valid videoId!")
    }

    const {title, description} = req.body;

    const newThumbnailLocalPath = req.files?.thumbnail[0]?.path;

    let newThumbnail = null;

    if(newThumbnailLocalPath){
       const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)
    }

    // new way to update 
    const updates = {}

    if(title)
        updates.title = title;

    if(description)
        updates.description = description;

    if(newThumbnail)
        updates.thumbnail = newThumbnail.url;
    
    const videoRes = await Video.findByIdAndUpdate(videoId, updates, { new: true})

    if(!videoRes){
        throw new ApiError(400, "update wasn't possible")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoRes, "Video updated successfully!")
    )

} )

export {
    getAllVideo,
    publishAVideo
}