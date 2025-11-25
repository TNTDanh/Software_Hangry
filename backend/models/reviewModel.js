import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: "order", required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "user", required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "restaurant", required: true },
    // rating tổng thể (giữ tương thích cũ)
    rating: { type: Number, min: 1, max: 5 },
    // rating chi tiết
    ratingFood: { type: Number, min: 1, max: 5 },
    ratingDriver: { type: Number, min: 1, max: 5 },
    ratingAvg: { type: Number, min: 1, max: 5 },
    comment: { type: String },
    images: [{ type: String }],
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
  },
  { timestamps: true }
);

const reviewModel =
  mongoose.models.review || mongoose.model("review", reviewSchema);
export default reviewModel;
