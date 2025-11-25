import express from "express";
import Stripe from "stripe";
import orderModel from "../models/orderModel.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookRouter = express.Router();

// Raw body parser is attached at server level; this handler assumes req.body is raw Buffer.
webhookRouter.post("/webhook", async (req, res) => {
  const sig = req.headers["stripe-signature"];
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return res.status(500).json({ success: false, message: "Missing STRIPE_WEBHOOK_SECRET" });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const orderId =
        session?.metadata?.orderId ||
        session?.client_reference_id ||
        session?.success_url?.split("orderId=")[1];

      if (orderId) {
        await orderModel.findByIdAndUpdate(orderId, {
          payment: true,
          $push: { statusTimeline: { status: "Paid", at: new Date() } },
        });
      }
    }

    if (event.type === "payment_intent.succeeded") {
      const pi = event.data.object;
      const orderId = pi?.metadata?.orderId;
      if (orderId) {
        await orderModel.findByIdAndUpdate(orderId, {
          payment: true,
          $push: { statusTimeline: { status: "Paid", at: new Date() } },
        });
      }
    }
  } catch (err) {
    console.error("Stripe webhook handler error:", err);
    return res.status(500).json({ success: false, message: "Webhook processing error" });
  }

  return res.json({ received: true });
});

export default webhookRouter;
