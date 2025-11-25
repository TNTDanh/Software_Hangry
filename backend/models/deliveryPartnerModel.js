import mongoose from "mongoose";

const deliveryPartnerSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["drone", "driver"], required: true },
    status: { type: String, enum: ["idle", "busy", "offline"], default: "idle" },
    speedKmH: { type: Number, default: 40 }, // drone có thể 60+
    capacity: { type: Number, default: 1 },
    currentCoords: {
      lat: { type: Number },
      lng: { type: Number },
    },
    name: { type: String },
  },
  { timestamps: true }
);

const deliveryPartnerModel =
  mongoose.models.deliveryPartner ||
  mongoose.model("deliveryPartner", deliveryPartnerSchema);
export default deliveryPartnerModel;
