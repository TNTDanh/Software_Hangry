import express from "express";
import {
  applyPromotion,
  createPromotion,
  listPromotions,
} from "../controllers/promotionController.js";
import authMiddleware, { optionalAuth } from "../middleware/auth.js";
import { requireOwnerOrAdmin } from "../middleware/access.js";

const promotionRouter = express.Router();

promotionRouter.post("/apply", applyPromotion);
promotionRouter.post("/add", authMiddleware, requireOwnerOrAdmin, createPromotion);
promotionRouter.get("/list", optionalAuth, listPromotions);

export default promotionRouter;
