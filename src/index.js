import dotenv from "dotenv"
import connectDB from "./db/index.js";
dotenv.config({
    path: './.env'
})

connectDB();

//first way to connect DB
/* (async () => {
  try {
    await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`)
    app.on("error", (error) => {
      console.log("ERROR: ", error)
      throw error
    })

    app.listen(process.env.PORT, () => {
      console.log(`App is listening on ${process.env.PORT}`)
    })
  } catch (error) {
    console.error("ERROR", error)
    throw error
  }
})()*/