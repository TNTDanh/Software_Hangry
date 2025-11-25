import mongoose from "mongoose";

const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameEn: { type: String },
    code: { type: String, required: true, unique: true },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const cityModel = mongoose.models.city || mongoose.model("city", citySchema);
export default cityModel;
