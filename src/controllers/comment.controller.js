import mongoose from 'mongoose';
import {asyncHandler} from '../utils/asyncHandler.js';
import { ApiError } from '../utils/ApiError.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Comment } from '../models/comment.model.js'
import { Video } from '../models/video.model.js'

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const { page = 1, limit = 10 } = req.query

    const pageNum = Number(page);
    const limitNum = Number(limit);

    if (!videoId) {
        throw new ApiError(400, "Video ID not found!")
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found!")
    }

    if (pageNum <= 0)
        throw new ApiError(400, "enter a valid pagenumber!")

    if (limitNum <= 0)
        throw new ApiError(400, "enter a valid limit!")

    const skip = (pageNum - 1) * limitNum;

    const comments = await Comment.find({ videoId })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate("owner", "username avatar")

    const totalComment = await Comment.countDocuments({ videoId })
    const totalPages = Math.ceil(totalComment / limitNum);

    return res.status(200).json({
        page: pageNum,
        limit: limitNum,
        totalPages,
        totalComment,
        comments
    });

})

const addComment = asyncHandler(async(req, res) => {
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

const UpdateComment = asyncHandler(async(req, res) => {
    const { commentId } = req.params;
    const { updatedContent } = req.body;

    if(!commentId){
        throw new ApiError(400, "No comment ID found!");
    }

    if(!updatedContent){
        throw new ApiError(400, "No comment content Found!")
    }

    const comment = await Comment.findById(commentId)

    if (!comment) {
        throw new ApiError(404, "comment not found!")
    }

    if (comment.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized user to update comments!")
    }

    const updatedComment = await Comment.findByIdAndUpdate(commentId, {
        $set : {
            content : updatedContent
        }
    }, {new : true})

    if (!updatedComment) {
        throw new ApiError(404, "NO COMMENT FOUND!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedComment, "Comment updated successfully!")
    )
} )

const deleteComment = asyncHandler( async(req, res) => {
    const { commentId } = req.params;

    if (!commentId) {
        throw new ApiError(400, "No comment ID found!")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found!")
    }

    if (comment.owner._id.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "Unauthorized user to delete comments!")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if (!deletedComment) {
        throw new ApiError(404, "No comment was found!")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, deletedComment, "The comment was successfully deleted!")
    )
} )

export {
    getVideoComments,
    addComment,
    UpdateComment,
    deleteComment
}