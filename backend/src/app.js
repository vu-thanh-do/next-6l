import express from "express";
import dotenv from "dotenv";
import authRouter from "./routes/auth.js";
import userRouter from "./routes/user.js";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import http from "http";
import News from "./models/news.js";

dotenv.config();
// khởi tạo
const app = express();
const server = http.createServer(app);
app.use(express.json());
app.use(cors());
app.use(express.json());
app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));
app.use("/api", authRouter);
app.use("/api", userRouter);
mongoose.connect(process.env.URI);
app.get("/", async (req, res) => {
  res.json("success");
});
app.post("/post-news", async (req, res) => {
  try {
    const newData = await News.create(req.body);
    return res.json(newData);
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
});
app.get("/news", async (req, res) => {
  try {
    const newData = await News.find({});
    return res.json(newData);
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
});
app.get("/new/:id", async (req, res) => {
  try {
    const newData = await News.findById(req.params.id);
    return res.json(newData);
  } catch (error) {
    return res.json({
      message: error.message,
    });
  }
});
server.listen(process.env.PORT, (req, res) => {
  try {
    console.log(`Server is running on port ${process.env.PORT} `);
  } catch (error) {
    console.log(error);
  }
});
