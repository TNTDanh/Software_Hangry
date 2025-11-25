import mongoose from "mongoose"

const coordinateSchema = new mongoose.Schema(
  {
    lat: { type: Number },
    lng: { type: Number },
  },
  { _id: false }
)

const orderItemSchema = new mongoose.Schema(
  {
    foodId: { type: mongoose.Schema.Types.ObjectId, ref: "food" },
    name: { type: String, required: true },
    nameEn: { type: String },
    price: { type: Number, required: true },
    quantity: { type: Number, required: true },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "restaurant" },
  },
  { _id: false }
)

const statusTimelineSchema = new mongoose.Schema(
  {
    status: { type: String },
    at: { type: Date, default: Date.now },
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "restaurant" },
  },
  { _id: false }
)

const subOrderSchema = new mongoose.Schema(
  {
    restaurantId: { type: mongoose.Schema.Types.ObjectId, ref: "restaurant" },
    items: [orderItemSchema],
    status: { type: String, default: "Food Processing" },
    deliveryType: { type: String, enum: ["drone", "driver"] },
    deliveryFee: { type: Number, default: 0 },
    etaMinutes: { type: Number },
  },
  { _id: false }
)

const orderSchema = new mongoose.Schema({
    userId:{type: mongoose.Schema.Types.ObjectId,ref:"user",required:true},
    items:{type:[orderItemSchema],required:true},
    amount:{type:Number,required:true}, // giữ tương thích tổng tiền cũ
    address:{type:Object,required:true},
    status:{type:String,default:"Food Processing"},
    date:{type:Date,default:Date.now()},
    payment:{type:Boolean,default:false},
    paymentMethod:{type:String, enum:["card","cod"], default:"cod"},
    deliveryType:{type:String,enum:["drone","driver"], default:"driver"},
    deliveryFee:{type:Number,default:0},
    etaMinutes:{type:Number},
    promoCode:{type:String},
    promoDiscount:{type:Number,default:0},
    subTotal:{type:Number},
    total:{type:Number},
    paymentIntentId:{type:String},
    deliveryPhase:{type:String, enum:["at_restaurant","delivering","delivered"], default:"at_restaurant"},
    droneId:{type:String},
    driverId:{type:String},
    route:{type:[coordinateSchema], default: []},
    statusTimeline:{type:[statusTimelineSchema], default: []},
    subOrders:{type:[subOrderSchema], default: []},
})

const orderModel = mongoose.models.order || mongoose.model("order",orderSchema)
export default orderModel;
