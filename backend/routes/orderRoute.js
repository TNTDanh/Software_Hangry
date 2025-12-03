import express from "express";
import authMiddleware from "../middleware/auth.js";
import { requireOwnerOrAdmin } from "../middleware/access.js";
import {
  placeOrder,
  placeOrderCOD,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  updateDeliveryPhase,
  revenueMetrics,
} from "../controllers/orderController.js";

const orderRouter = express.Router();

orderRouter.post("/place", authMiddleware, placeOrder);
orderRouter.post("/place-cod", authMiddleware, placeOrderCOD); // << thA�m
orderRouter.post("/verify", verifyOrder);
orderRouter.post("/userorders", authMiddleware, userOrders);
orderRouter.get("/list", authMiddleware, requireOwnerOrAdmin, listOrders);
orderRouter.get("/metrics/revenue", authMiddleware, requireOwnerOrAdmin, revenueMetrics);
orderRouter.post("/status", authMiddleware, requireOwnerOrAdmin, updateStatus);
orderRouter.patch("/delivery/:orderId", authMiddleware, requireOwnerOrAdmin, updateDeliveryPhase);

export default orderRouter;
