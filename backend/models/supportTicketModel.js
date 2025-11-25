import mongoose from "mongoose";

const supportTicketSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order" },
    subject: { type: String, required: true },
    message: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "resolved", "closed"],
      default: "open",
    },
    replies: [
      {
        by: { type: String, enum: ["user", "admin"], required: true },
        message: { type: String, required: true },
        at: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

const supportTicketModel =
  mongoose.models.supportTicket ||
  mongoose.model("supportTicket", supportTicketSchema);
export default supportTicketModel;
