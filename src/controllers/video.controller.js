import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllVideo = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;

    // Convert page and limit to numbers 
    const pageNum = Number(page);
    const limitNum = Number(limit);

    const filterObject = {}

    // if query exists : search in title or description
    if (query) {
        filterObject.$or = [
            { title: { $regex: query, $options: "i" } },
            { description: { regex: query, $options: "i" } }
        ]
    }

    //filter by userId 
    if (userId) {
        filterObject.owner = userId
    }

    //sorting rule 
    const sortRule = {}
    sortRule[sortBy] = sortType === "asc" ? 1 : -1;

    // Pagination
    const skipVideo = (pageNum - 1) * limitNum;

    // Fetch video
    const videos = await Video.find(filterObject).sort(sortRule).skip(skipVideo).limit(limitNum);

    // totalCount 
    const totalVideos = await Video.countDocuments(filterObject);

    return res
        .status(200)
        .json(
            new ApiResponse(200, {
                page: pageNum,
                limit: limitNum,
                total: totalVideos,
                totalPages: Math.ceil(totalVideos / limitNum)
            }, videos, "videos fetched successfully!")
        )
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;

    if (!title) {
        throw new ApiError(401, "Enter a valid title!")
    }
    console.log(title);

    console.log(description);

    if (!description) {
        throw new ApiError(401, "Enter a valid description!")
    }

    const VideoFileLocalPath = req.files?.videoFile?.[0]?.path

    if (!VideoFileLocalPath) {
        throw new ApiError(401, "No video found!")
    }

    const thumbnailLocalPath = req.files?.thumbnail?.[0]?.path

    if (!thumbnailLocalPath) {
        throw new ApiError(401, "Enter a valid thumbnail!")
    }

    const videoFile = await uploadOnCloudinary(VideoFileLocalPath);
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        views: 0,
        isPublished: true,
        owner: req.user?._id
    })

    if (!video) {
        throw new ApiError(400, "Video Upload failed!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, video, "video file uploaded successfully")
        )

})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(401, "Video ID is missing!")
    }

    const videoRes = await Video.findByIdAndUpdate(videoId, {
        $inc: {
            views: 1
        },
    },
        { new: true }
    )

    if (!videoRes) {
        throw new ApiError(404, "Video isn't available")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoRes, "Video fetched successfully")
        )
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(401, "Enter a valid videoId!")
    }

    const { title, description } = req.body;

    const newThumbnailLocalPath = req.files?.thumbnail[0]?.path;

    let newThumbnail = null;

    if (newThumbnailLocalPath) {
        const newThumbnail = await uploadOnCloudinary(newThumbnailLocalPath)
    }

    // new way to update 
    const updates = {}

    if (title)
        updates.title = title;

    if (description)
        updates.description = description;

    if (newThumbnail)
        updates.thumbnail = newThumbnail.url;

    const videoRes = await Video.findByIdAndUpdate(videoId, updates, { new: true })

    if (!videoRes) {
        throw new ApiError(400, "update wasn't possible")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, videoRes, "Video updated successfully!")
        )

})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!videoId) {
        throw new ApiError(401, "No video id found!");
    }

    const deletedVideo = await Video.findByIdAndDelete(videoId);

    if (!deletedVideo) {
        throw new ApiError(404, "No video found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, deletedVideo, "This video was successfully deleted!")
        )
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params

    if (!videoId) {
        throw new ApiError(400, "Bad request!")
    }

    const updatedVideo = await Video.findByIdAndUpdate(videoId, [
        {
            $set: {
                isPublished: {
                    $cond: {
                        if: "$isPublished",
                        then: false,
                        else: true
                    }
                }
            }
        }
    ], { new: true })

    if (!updatedVideo) {
        throw new ApiError(404, "Video was not found!")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, updatedVideo, `Video status updated to ${updatedVideo.isPublished} ? "Published" : "Unpublished"`)
        )
})

export {
    getAllVideo,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}