import express from "express";
import {
  addRestaurant,
  listRestaurants,
  toggleRestaurant,
} from "../controllers/restaurantController.js";
import authMiddleware, { optionalAuth } from "../middleware/auth.js";
import { requireOwnerOrAdmin } from "../middleware/access.js";

const restaurantRouter = express.Router();

restaurantRouter.post("/add", authMiddleware, requireOwnerOrAdmin, addRestaurant);
restaurantRouter.get("/list", optionalAuth, listRestaurants);
restaurantRouter.post("/toggle", authMiddleware, requireOwnerOrAdmin, toggleRestaurant);

export default restaurantRouter;
