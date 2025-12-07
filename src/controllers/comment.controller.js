import mongoose from 'mongoose';
import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Comment } from '../models/comment.model.js'
import { Video } from '../models/video.model.js'

const getVideoComments = asyncHandler( async(req, res)  => {
    const {videoId} = req.params
    const {page = 1, limit = 10} = req.query
})

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { comment } = req.body;

    if (!videoId) {
        throw new ApiError(401, "No video ID found!")
    }

    if (!comment) {
        throw new ApiError(401, "Enter a valid comment!")
    }

    const video = await Video.findById(videoId);
    if (!video) throw new ApiError(404, "Video not found");


    const newComment = await Comment.create({
        content: comment,
        video: videoId,
        owner: req.user?._id
    })

    if (!newComment) {
        throw new ApiError(400, "Something went wrong while creating comment")
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, newComment, "Comment was successfully added!")
        )
})

export {
    getVideoComments,
    addComment
}