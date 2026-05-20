import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import morgan from "morgan";

dotenv.config();

const app = express();


// Middlewares
app.use(cors());
app.use(express.json());
app.use(morgan("dev"));


// Route test
app.get("/", (req, res) => {
  res.json({
    message: "API is running 🚀",
  });
});


// Connexion MongoDB
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected ✅");

    app.listen(process.env.PORT, () => {
      console.log(
        `Server running on port ${process.env.PORT}`
      );
    });
  })
  .catch((error) => {
    console.log(error);
  });