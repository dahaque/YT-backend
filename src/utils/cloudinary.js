import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_API_NAME , 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET 
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
      if(!localFilePath)
        return null;
      // else upload file
      const response = await cloudinary.uploader.upload(localFilePath, {
        resource_type : "auto"
      })
      // if file is successfully uploaded
      // console.log(`File uploaded succesfully : ${response.url}`)
      fs.unlinkSync(localFilePath)
      return response;
    } catch (error) {
      fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed.
      return null;
    }
}

export default uploadOnCloudinary;