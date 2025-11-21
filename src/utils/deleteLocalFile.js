import fs from "fs";

const deleteLocalFile = async(LocalfilePath) => {
    try {
        if (fs.existsSync(LocalfilePath)) {
            fs.unlinkSync(LocalfilePath);
            console.log("Old file deleted:", LocalfilePath);
        }
    } catch (error) {
        console.error("Error while deleting local file:", error);
    }
};

export {deleteLocalFile}