import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path: './.env'
})


const PORT = process.env.PORT || 4000;

// Second way
connectDB() // This is an async function so it'll return a promise when executed
.then(() => {
  app.on("error", (error) => {
    console.log("ERR : ", error)
    throw error
  })

  app.listen(PORT, () => {
    console.log(`Server is running on : ${PORT}`)
  })
})
.catch((error) => {
  console.log(`DB CONNECTION FAILED :${error}`)
})

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