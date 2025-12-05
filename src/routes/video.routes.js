import { Router } from "express";
import { 
    getAllVideo,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
 } from "../controllers/video.controller.js";

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const videoRouter = Router();

videoRouter.route("/publish").post(verifyJWT, upload.fields([
    {
        name: "videoFile",
        maxCount : 1
    },
    {
        name : "thumbnail",
        maxCount : 1
    }]), publishAVideo);

videoRouter.route("/get-all-videos").get(verifyJWT, getAllVideo);   

videoRouter.route("/get-video").get(verifyJWT, getVideoById);   

videoRouter.route("/update-video").post(verifyJWT, updateVideo);

videoRouter.route("/toggle-publish-status").post(verifyJWT, togglePublishStatus);

videoRouter.route("/delete-video").post(verifyJWT, deleteVideo);    

export default videoRouter;    
    