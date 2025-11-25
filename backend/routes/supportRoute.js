import express from "express";
import {
  createTicket,
  listTickets,
  replyTicket,
  updateTicketStatus,
} from "../controllers/supportController.js";

const supportRouter = express.Router();

supportRouter.post("/create", createTicket);
supportRouter.get("/list", listTickets);
supportRouter.post("/reply", replyTicket);
supportRouter.post("/status", updateTicketStatus);

export default supportRouter;
