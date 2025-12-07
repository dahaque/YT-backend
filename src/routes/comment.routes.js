import { Router } from "express";
import {
    addComment
} from '../controllers/comment.controller.js'

import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const commentRouter = Router();

commentRouter.route('/add-comment/:videoId').post(verifyJWT,addComment);





export default commentRouter;