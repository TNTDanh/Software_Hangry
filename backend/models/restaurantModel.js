import mongoose from "mongoose";

const restaurantSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    nameEn: { type: String },
    slug: { type: String, required: true, unique: true },
    cityId: { type: mongoose.Schema.Types.ObjectId, ref: "city", required: true },
    address: { type: String },
    addressEn: { type: String },
    coords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    image: { type: String },
    active: { type: Boolean, default: true },
    deliveryModes: {
      type: [String],
      enum: ["drone", "driver"],
      default: ["driver"],
    },
    minOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const restaurantModel =
  mongoose.models.restaurant || mongoose.model("restaurant", restaurantSchema);
export default restaurantModel;
