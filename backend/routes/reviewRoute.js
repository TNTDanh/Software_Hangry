import express from "express";
import {
  addReview,
  listReviews,
  approveReview,
} from "../controllers/reviewController.js";

const reviewRouter = express.Router();

reviewRouter.post("/add", addReview);
reviewRouter.get("/list", listReviews);
reviewRouter.post("/approve", approveReview);

export default reviewRouter;
