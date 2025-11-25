import mongoose from "mongoose";

const promotionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true },
    type: { type: String, enum: ["percent", "amount"], required: true },
    value: { type: Number, required: true }, // percent (0-100) hoặc số tiền giảm
    maxDiscount: { type: Number },
    minOrder: { type: Number, default: 0 },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "restaurant" },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "city" },
    startAt: { type: Date },
    endAt: { type: Date },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const promotionModel =
  mongoose.models.promotion || mongoose.model("promotion", promotionSchema);
export default promotionModel;
