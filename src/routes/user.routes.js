import { Router } from "express";
import { 
  changePassword, 
  getCurrentuser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  registerUser, 
  updateAccountDetails, 
  getUserChannelProfile, 
  getWatchHistory, 
  updateUserAvatar, 
  updateUserCoverImage 
} from "../controllers/user.controller.js";

import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(upload.fields([
  {
    name : "avatar",
    maxCount : 1
  },
  {
    name : "coverImage",
    maxCount : 1
  }
]), registerUser)

userRouter.route("/login").post(loginUser)

// secured routes
userRouter.route("/logout").post(verifyJWT ,logoutUser)

userRouter.route("/refresh-token").post(refreshAccessToken)

userRouter.route("/change-password").post(verifyJWT, changePassword)

userRouter.route("/current-user").get(verifyJWT, getCurrentuser)

userRouter.route("/update-account-details").patch(verifyJWT, updateAccountDetails)

userRouter.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

userRouter.route("/update-cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

userRouter.route("/channel/:username").get(verifyJWT, getUserChannelProfile)

userRouter.route("/watch-history").get(verifyJWT, getWatchHistory)

export default userRouter