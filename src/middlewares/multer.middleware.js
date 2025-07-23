import multer from "multer";

// This method returns local file path
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "./public/temp")
    },
    filename: function (req, file, cb) {
      
      cb(null, file.originalname) // Not a good practice to save file name as the original name, because their 
                                    // can be multiple files that can override each other with the same name.
    }
  })
  
export const upload = multer({ storage });