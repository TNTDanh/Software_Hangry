// ...existing code...
import dotenv from 'dotenv';
dotenv.config();
// import cloudinary config (optional) so credential check happens early
import "./config/cloudinary.js";

import express from "express"
import cors from "cors"
import { connectDB } from "./config/db.js"
import foodRouter from "./routes/foodRoute.js"
import userRouter from "./routes/userRoute.js"
import 'dotenv/config'
import cartRouter from "./routes/cartRoute.js"
import orderRouter from "./routes/orderRoute.js"
import cityRouter from "./routes/cityRoute.js"
import restaurantRouter from "./routes/restaurantRoute.js"
import promotionRouter from "./routes/promotionRoute.js"
import reviewRouter from "./routes/reviewRoute.js"
import supportRouter from "./routes/supportRoute.js"
import stripeWebhookRouter from "./routes/stripeRoute.js"


// app config
const app = express()
const port = process.env.PORT || 4000

// Stripe webhook: must be raw before json parser
app.use("/api/stripe", express.raw({ type: "application/json" }), stripeWebhookRouter)

// CORS: use CLIENT_URL env (comma-separated) or fallback to common dev origins
const rawOrigins = process.env.CLIENT_URL || "http://localhost:8081,http://127.0.0.1:8081,http://localhost:3000";
const allowedOrigins = rawOrigins.split(",").map(s => s.trim());

app.use(express.json())
app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin (mobile apps, curl, Postman)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));

// db connection
connectDB();

// api endpoints
app.use("/api/food", foodRouter)
app.use("/images", express.static("uploads", {
  setHeaders: (res, path, stat) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
  },
}));

app.use("/api/user", userRouter)
app.use("/api/cart", cartRouter)
app.use("/api/order", orderRouter)
app.use("/api/city", cityRouter)
app.use("/api/restaurant", restaurantRouter)
app.use("/api/promo", promotionRouter)
app.use("/api/review", reviewRouter)
app.use("/api/support", supportRouter)

app.get("/", (req, res) => {
  res.send("API Working")
})

// listen with basic error handling
const server = app.listen(port, () => {
  console.log(`Server Started on http://localhost:${port}`)
  console.log(`[CORS] allowed origins: ${allowedOrigins.join(", ")}`)
});

server.on('error', (err) => {
  if (err && err.code === 'EADDRINUSE') {
    console.error(`Port ${port} is already in use. Kill the process using it or set a different PORT.`);
    process.exit(1);
  } else {
    console.error('Server error:', err);
    process.exit(1);
  }
});
// ...existing code...
