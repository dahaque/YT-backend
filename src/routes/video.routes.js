import { Router } from "express";
import { 
    publishAVideo
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
    

export default videoRouter;    
    