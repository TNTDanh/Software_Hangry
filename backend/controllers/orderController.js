import orderModel from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import restaurantModel from "../models/restaurantModel.js";
import mongoose from "mongoose";
import Stripe from "stripe";
import { filterForOwner } from "../middleware/access.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5174";

const DELIVERY_FEE_DRIVER = 20000;
const DELIVERY_FEE_DRONE = 30000;

const buildTotals = (items = [], deliveryType, overrides = {}) => {
  const subTotal = overrides.subTotal ??
    items.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0);
  const deliveryFee =
    overrides.deliveryFee ??
    (deliveryType === "drone" ? DELIVERY_FEE_DRONE : DELIVERY_FEE_DRIVER);
  const promoDiscount = overrides.promoDiscount ?? 0;
  const total = overrides.total ?? Math.max(0, subTotal + deliveryFee - promoDiscount);

  return { subTotal, deliveryFee, promoDiscount, total, amount: total };
};

const buildSubOrders = (items = [], deliveryType, deliveryFee, etaMinutes) => {
  const byRestaurant = items.reduce((map, it) => {
    const rId = it.restaurantId?.toString();
    if (!rId) return map;
    if (!map[rId]) map[rId] = [];
    map[rId].push(it);
    return map;
  }, {});

  return Object.entries(byRestaurant).map(([restaurantId, list]) => ({
    restaurantId,
    items: list,
    deliveryType,
    deliveryFee,
    etaMinutes,
  }));
};

// placing user order from frontend (Stripe Checkout)
const placeOrder = async (req, res) => {
  try {
    const {
      userId,
      items = [],
      address,
      deliveryType = "driver",
      promoCode,
      promoDiscount = 0,
      etaMinutes,
      route = [],
    } = req.body;

    const totals = buildTotals(items, deliveryType, {
      promoDiscount,
      subTotal: req.body.subTotal,
      deliveryFee: req.body.deliveryFee,
      total: req.body.total,
      amount: req.body.amount,
    });

    // Kiểm tra nhà hàng active cho tất cả items
    const uniqueRestaurants = Array.from(
      new Set((items || []).map((it) => it.restaurantId?.toString()).filter(Boolean))
    );
    if (uniqueRestaurants.length) {
      const inactive = await restaurantModel.find({
        _id: { $in: uniqueRestaurants },
        active: false,
      });
      if (inactive.length) {
        return res.status(400).json({ success: false, message: "Restaurant inactive, cannot place order" });
      }
    }

    const newOrder = new orderModel({
      userId,
      items,
      amount: totals.amount,
      address,
      deliveryType,
      deliveryFee: totals.deliveryFee,
      etaMinutes,
      promoCode,
      promoDiscount: totals.promoDiscount,
      subTotal: totals.subTotal,
      total: totals.total,
      payment: true,
      paymentMethod: "card",
      route,
      subOrders: buildSubOrders(items, deliveryType, totals.deliveryFee, etaMinutes),
      statusTimeline: [{ status: "Food Processing", at: new Date() }],
    });
    await newOrder.save();

    // clear cart on server immediately (kept same as original logic)
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    // Stripe amounts must be in minor units; choose USD for test mode (VND không được hỗ trợ trực tiếp)
    const toUsdCents = (vnd) => Math.max(1, Math.round((Number(vnd) || 0) / 24000 * 100));

    const line_items = items.map((item) => ({
      price_data: {
        currency: "usd",
        product_data: { name: item.name },
        unit_amount: toUsdCents(item.price),
      },
      quantity: item.quantity,
    }));

    line_items.push({
      price_data: {
        currency: "usd",
        product_data: { name: "Delivery Charges" },
        unit_amount: toUsdCents(totals.deliveryFee),
      },
      quantity: 1,
    });

    const session = await stripe.checkout.sessions.create({
      line_items,
      mode: "payment",
      success_url: `${FRONTEND_URL}/verify?success=true&orderId=${newOrder._id}`,
      cancel_url: `${FRONTEND_URL}/verify?success=false&orderId=${newOrder._id}`,
      client_reference_id: newOrder._id.toString(),
      metadata: {
        orderId: newOrder._id.toString(),
        userId: userId?.toString() || "",
      },
    });

    res.json({ success: true, session_url: session.url, orderId: newOrder._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// COD: place order without Stripe
const placeOrderCOD = async (req, res) => {
  try {
    const {
      userId,
      items = [],
      address,
      deliveryType = "driver",
      promoCode,
      promoDiscount = 0,
      etaMinutes,
      route = [],
    } = req.body;

    const totals = buildTotals(items, deliveryType, {
      promoDiscount,
      subTotal: req.body.subTotal,
      deliveryFee: req.body.deliveryFee,
      total: req.body.total,
      amount: req.body.amount,
    });

    // Kiểm tra nhà hàng active
    const uniqueRestaurants = Array.from(
      new Set((items || []).map((it) => it.restaurantId?.toString()).filter(Boolean))
    );
    if (uniqueRestaurants.length) {
      const inactive = await restaurantModel.find({
        _id: { $in: uniqueRestaurants },
        active: false,
      });
      if (inactive.length) {
        return res.status(400).json({ success: false, message: "Restaurant inactive, cannot place order" });
      }
    }

    const newOrder = new orderModel({
      userId,
      items,
      amount: totals.amount,
      address,
      payment: false, // unpaid, COD
      paymentMethod: "cod",
      deliveryType,
      deliveryFee: totals.deliveryFee,
      etaMinutes,
      promoCode,
      promoDiscount: totals.promoDiscount,
      subTotal: totals.subTotal,
      total: totals.total,
      route,
      subOrders: buildSubOrders(items, deliveryType, totals.deliveryFee, etaMinutes),
      statusTimeline: [{ status: "Food Processing", at: new Date() }],
    });
    await newOrder.save();

    // clear cart on server
    await userModel.findByIdAndUpdate(userId, { cartData: {} });

    res.json({ success: true, orderId: newOrder._id });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

const verifyOrder = async (req, res) => {
  const { orderId, success } = req.body;
  try {
    if (success == "true") {
      await orderModel.findByIdAndUpdate(orderId, {
        payment: true,
        $push: { statusTimeline: { status: "Paid", at: new Date() } },
      });
      res.json({ success: true, message: "Paid" });
    } else {
      await orderModel.findByIdAndDelete(orderId);
      res.json({ success: false, message: "Not Paid" });
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// user orders for frontend (sorted newest-first)
const userOrders = async (req, res) => {
  try {
    const orders = await orderModel
      .find({ userId: req.body.userId })
      .sort({ date: -1 });
    res.json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// Listing orders for admin panel (sorted newest-first)
const listOrders = async (req, res) => {
  try {
    const baseFilter = {};
    const requestedRestaurantIds = [];
    if (req.query.restaurantId) {
      baseFilter["items.restaurantId"] = req.query.restaurantId;
      requestedRestaurantIds.push(req.query.restaurantId.toString());
    }
    const filter = filterForOwner(req.user, baseFilter, "items.restaurantId");
    if (req.user?.role === "restaurantOwner" && Array.isArray(req.user.restaurantIds)) {
      requestedRestaurantIds.push(...req.user.restaurantIds.map((id) => id.toString()));
    }
    const requestedSet = new Set(requestedRestaurantIds);

    const orders = await orderModel.find(filter).sort({ date: -1 });

    // Nếu lọc theo nhà hàng, chỉ trả items/subOrders thuộc nhà hàng đó
    let data = orders;
    if (requestedSet.size) {
      data = orders.map((ord) => {
        const o = ord.toObject();
        const allRestIds = Array.from(new Set((o.items || []).map((it) => it.restaurantId?.toString()).filter(Boolean)));

        o.items = o.items?.filter((it) => requestedSet.has(it.restaurantId?.toString()));
        if (o.subOrders?.length) {
          o.subOrders = o.subOrders.filter((sub) => requestedSet.has(sub.restaurantId?.toString()));
        }
        // Recalculate totals for the filtered items (so each restaurant sees its own totals)
        const subTotalFiltered =
          o.items?.reduce((sum, it) => sum + Number(it.price || 0) * Number(it.quantity || 1), 0) || 0;

        let deliveryFiltered =
          o.subOrders?.reduce((sum, sub) => sum + Number(sub.deliveryFee || 0), 0) || 0;
        // fallback: nếu subOrders rỗng, chia đều phí giao theo số nhà hàng trong đơn gốc
        if (!deliveryFiltered && allRestIds.length > 0) {
          deliveryFiltered = (Number(o.deliveryFee || 0) || 0) / allRestIds.length;
        }

        o.subTotal = subTotalFiltered;
        o.deliveryFee = deliveryFiltered;
        o.promoDiscount = 0; // không phân bổ giảm giá theo nhà hàng, tránh hiển thị sai lệch
        o.total = subTotalFiltered + deliveryFiltered;
        o.amount = o.total;
        return o;
      });
    }

    res.json({ success: true, data });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// api for updating order status
const updateStatus = async (req, res) => {
  try {
    const orderId = req.body.orderId;
    const newStatus = req.body.status;
    let restaurantId = req.body.restaurantId;
    if (!orderId || !newStatus) return res.status(400).json({ success: false, message: "orderId and status required" });

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });
    const normalizedStatus = typeof newStatus === "string" ? newStatus.toLowerCase() : "";
    const setPayment = normalizedStatus === "delivered" && order.paymentMethod === "cod";
    // map status -> deliveryPhase
    const phaseMap = {
      "Food Processing": "at_restaurant",
      "Out For Delivery": "delivering",
      Delivered: "delivered",
    };
    const phaseUpdate = phaseMap[newStatus] || undefined;

    // Owner can only update orders from their restaurants
    if (req.user?.role === "restaurantOwner") {
      const allowed = (req.user.restaurantIds || []).map((id) => id.toString());
      const restInOrder = Array.from(
        new Set([
          ...(order.subOrders || []).map((s) => s.restaurantId?.toString()).filter(Boolean),
          ...(order.items || []).map((it) => it.restaurantId?.toString()).filter(Boolean),
        ])
      );

      if (!restaurantId) {
        // nếu owner chỉ có một nhà hàng trong đơn, tự chọn
        const intersection = restInOrder.filter((r) => allowed.includes(r));
        if (intersection.length === 1) {
          restaurantId = intersection[0];
        } else {
          return res
            .status(400)
            .json({ success: false, message: "restaurantId required for this order" });
        }
      }

      if (!allowed.includes(String(restaurantId))) {
        return res.status(403).json({ success: false, message: "Not allowed for this restaurant" });
      }
      if (!restInOrder.includes(String(restaurantId))) {
        return res.status(404).json({ success: false, message: "Restaurant not in this order" });
      }

      // Cập nhật subOrder nếu có, nếu không thì cập nhật toàn bộ đơn (trường hợp đơn 1 nhà hàng không có subOrders)
      const updateDoc =
        order.subOrders?.length
          ? {
              $set: {
                "subOrders.$[s].status": newStatus,
                status: newStatus,
                ...(setPayment ? { payment: true } : {}),
                ...(phaseUpdate ? { deliveryPhase: phaseUpdate } : {}),
              },
              $push: { statusTimeline: { status: newStatus, at: new Date(), restaurantId } },
            }
          : {
              status: newStatus,
              ...(setPayment ? { payment: true } : {}),
              ...(phaseUpdate ? { deliveryPhase: phaseUpdate } : {}),
              $push: { statusTimeline: { status: newStatus, at: new Date(), restaurantId } },
            };

      const updated = await orderModel.findOneAndUpdate(
        { _id: orderId },
        updateDoc,
        {
          arrayFilters: order.subOrders?.length ? [{ "s.restaurantId": restaurantId }] : undefined,
          new: true,
        }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: "Order or sub order not found" });
      }

      return res.json({ success: true, message: "Status Updated (restaurant scope)" });
    }

    // Admin: nếu có restaurantId và có subOrders, chỉ cập nhật subOrder đó; ngược lại cập nhật toàn đơn
    if (restaurantId && order.subOrders?.length) {
      const updated = await orderModel.findOneAndUpdate(
        { _id: orderId },
        {
          $set: {
            "subOrders.$[s].status": newStatus,
            status: newStatus,
            ...(setPayment ? { payment: true } : {}),
            ...(phaseUpdate ? { deliveryPhase: phaseUpdate } : {}),
          },
          $push: { statusTimeline: { status: newStatus, at: new Date(), restaurantId } },
        },
        {
          arrayFilters: [{ "s.restaurantId": restaurantId }],
          new: true,
        }
      );
      if (!updated) {
        return res.status(404).json({ success: false, message: "Sub order not found for restaurant" });
      }
      return res.json({ success: true, message: "Status Updated (restaurant scope)" });
    }

    await orderModel.findByIdAndUpdate(orderId, {
      status: newStatus,
      ...(setPayment ? { payment: true } : {}),
      ...(phaseUpdate ? { deliveryPhase: phaseUpdate } : {}),
      $push: { statusTimeline: { status: newStatus, at: new Date() } },
    });
    res.json({ success: true, message: "Status Updated" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// admin/owner updates delivery phase, droneId, driverId
const updateDeliveryPhase = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { phase, droneId, driverId } = req.body || {};
    const allowedPhases = ["at_restaurant", "delivering", "delivered"];
    if (phase && !allowedPhases.includes(phase)) {
      return res.status(400).json({ success: false, message: "Invalid phase" });
    }

    const order = await orderModel.findById(orderId);
    if (!order) return res.status(404).json({ success: false, message: "Order not found" });

    // restaurantOwner must belong to the restaurants in the order
    if (req.user?.role === "restaurantOwner") {
      const allowed = (req.user.restaurantIds || []).map((id) => id.toString());
      const restInOrder = Array.from(
        new Set(
          [
            ...(order.subOrders || []).map((s) => s.restaurantId?.toString()).filter(Boolean),
            ...(order.items || []).map((it) => it.restaurantId?.toString()).filter(Boolean),
          ].filter(Boolean)
        )
      );
      const hasPermission = restInOrder.some((r) => allowed.includes(r));
      if (!hasPermission) {
        return res.status(403).json({ success: false, message: "Not allowed for this order" });
      }
    }

    if (phase) order.deliveryPhase = phase;
    if (typeof droneId !== "undefined") order.droneId = droneId;
    if (typeof driverId !== "undefined") order.driverId = driverId;

    // sync status with phase if provided
    if (phase) {
      const statusMap = {
        at_restaurant: "Food Processing",
        delivering: "Out For Delivery",
        delivered: "Delivered",
      };
      const mapped = statusMap[phase];
      if (mapped) {
        order.status = mapped;
        order.statusTimeline = order.statusTimeline || [];
        order.statusTimeline.push({ status: mapped, at: new Date() });
        if (phase === "delivered" && order.paymentMethod === "cod") {
          order.payment = true;
        }
      }
    }

    const saved = await order.save();
    res.json({ success: true, data: saved });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

// Revenue metrics for admin/owner dashboard
const revenueMetrics = async (req, res) => {
  try {
    const { restaurantId, from, to } = req.query || {};

    // only allow delivered orders to count as revenue
    const deliveredMatch = {
      $or: [{ deliveryPhase: "delivered" }, { status: "Delivered" }],
    };

    // date filter uses "date" field stored on order
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);
    const dateMatch = Object.keys(dateFilter).length ? { date: dateFilter } : {};

    // Owner scope
    const allowedRestaurants =
      req.user?.role === "restaurantOwner"
        ? (req.user.restaurantIds || []).map((id) => id.toString())
        : null;

    // If owner and no restaurants, block
    if (req.user?.role === "restaurantOwner" && !allowedRestaurants.length) {
      return res
        .status(403)
        .json({ success: false, message: "No restaurants assigned to this owner" });
    }

    // build restaurant filter array
    let scopedRestaurants = [];
    if (restaurantId) scopedRestaurants.push(restaurantId.toString());
    if (allowedRestaurants) {
      scopedRestaurants = scopedRestaurants.length
        ? scopedRestaurants.filter((r) => allowedRestaurants.includes(r))
        : [...allowedRestaurants];
      if (!scopedRestaurants.length) {
        return res.status(403).json({ success: false, message: "Not allowed for this restaurant" });
      }
    }
    const scopedObjectIds = scopedRestaurants
      .map((r) => {
        try {
          return new mongoose.Types.ObjectId(r);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
    // allow matching both ObjectId and string ids (in case data stored as string)
    const scopedAnyIds = [...scopedObjectIds, ...scopedRestaurants.filter(Boolean)];

    const matchBase = {
      ...deliveredMatch,
      ...dateMatch,
    };
    const matchRestaurant = scopedAnyIds.length
      ? {
          $or: [
            { "items.restaurantId": { $in: scopedAnyIds } },
            { "subOrders.restaurantId": { $in: scopedAnyIds } },
          ],
        }
      : {};
    const matchItems = { ...matchBase };
    const matchSubOrders = { ...matchBase };

    if (scopedAnyIds.length) {
      matchItems["items.restaurantId"] = { $in: scopedAnyIds };
      matchSubOrders["subOrders.restaurantId"] = { $in: scopedAnyIds };
    }

    // aggregate items-based revenue
    const itemsPipeline = [
      { $match: { ...matchItems, ...matchRestaurant } },
      { $unwind: "$items" },
      ...(scopedAnyIds.length
        ? [{ $match: { "items.restaurantId": { $in: scopedAnyIds } } }]
        : []),
      {
        $group: {
          _id: "$items.restaurantId",
          revenue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$items.price", 0] },
                { $ifNull: ["$items.quantity", 0] },
              ],
            },
          },
          orders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          restaurantId: "$_id",
          revenue: 1,
          orders: { $size: "$orders" },
        },
      },
    ];

    // aggregate delivery fees per restaurant (if subOrders used)
    const subOrdersPipeline = [
      { $match: { ...matchSubOrders, ...matchRestaurant } },
      { $unwind: "$subOrders" },
      ...(scopedAnyIds.length
        ? [{ $match: { "subOrders.restaurantId": { $in: scopedAnyIds } } }]
        : []),
      {
        $group: {
          _id: "$subOrders.restaurantId",
          deliveryFee: { $sum: { $ifNull: ["$subOrders.deliveryFee", 0] } },
          orders: { $addToSet: "$_id" },
        },
      },
      {
        $project: {
          _id: 0,
          restaurantId: "$_id",
          deliveryFee: 1,
          orders: { $size: "$orders" },
        },
      },
    ];

    // distinct order count for overall
    const totalOrdersQuery = orderModel.countDocuments({
      ...matchBase,
      ...matchRestaurant,
    });

    // timeseries (by day) revenue/orders
    const dayString = {
      $dateToString: { format: "%Y-%m-%d", date: "$date" },
    };
    const itemsTimeseriesPipeline = [
      { $match: { ...matchItems, ...matchRestaurant } },
      { $unwind: "$items" },
      ...(scopedAnyIds.length
        ? [{ $match: { "items.restaurantId": { $in: scopedAnyIds } } }]
        : []),
      {
        $group: {
          _id: dayString,
          revenue: {
            $sum: {
              $multiply: [
                { $ifNull: ["$items.price", 0] },
                { $ifNull: ["$items.quantity", 0] },
              ],
            },
          },
          orders: { $addToSet: "$_id" },
        },
      },
    ];
    const subOrdersTimeseriesPipeline = [
      { $match: { ...matchSubOrders, ...matchRestaurant } },
      { $unwind: "$subOrders" },
      ...(scopedAnyIds.length
        ? [{ $match: { "subOrders.restaurantId": { $in: scopedAnyIds } } }]
        : []),
      {
        $group: {
          _id: dayString,
          deliveryFee: { $sum: { $ifNull: ["$subOrders.deliveryFee", 0] } },
          orders: { $addToSet: "$_id" },
        },
      },
    ];

    const [itemsAgg, subOrdersAgg, totalOrders] = await Promise.all([
      orderModel.aggregate(itemsPipeline),
      orderModel.aggregate(subOrdersPipeline),
      totalOrdersQuery,
    ]);

    const [itemsTs, subOrdersTs] = await Promise.all([
      orderModel.aggregate(itemsTimeseriesPipeline),
      orderModel.aggregate(subOrdersTimeseriesPipeline),
    ]);

    // merge per-restaurant data
    const map = {};
    itemsAgg.forEach((row) => {
      const key = row.restaurantId?.toString();
      if (!key) return;
      map[key] = {
        restaurantId: key,
        revenue: row.revenue || 0,
        orders: row.orders || 0,
        deliveryFee: 0,
      };
    });

    subOrdersAgg.forEach((row) => {
      const key = row.restaurantId?.toString();
      if (!key) return;
      if (!map[key]) {
        map[key] = {
          restaurantId: key,
          revenue: 0,
          orders: row.orders || 0,
          deliveryFee: 0,
        };
      }
      map[key].deliveryFee = (map[key].deliveryFee || 0) + (row.deliveryFee || 0);
      // orders count stays as-is (itemsAgg already counted unique orders)
    });

    const restaurants = Object.values(map).map((r) => ({
      restaurantId: r.restaurantId,
      revenue: (r.revenue || 0) + (r.deliveryFee || 0),
      orders: r.orders || 0,
    }));

    const totalRevenue = restaurants.reduce((sum, r) => sum + Number(r.revenue || 0), 0);
    const totalOrdersSafe = Number(totalOrders || 0);
    const avgOrderValue = totalOrdersSafe > 0 ? totalRevenue / totalOrdersSafe : 0;

    // build timeseries map
    const tsMap = {};
    const ensureDay = (day) => {
      if (!tsMap[day]) tsMap[day] = { day, revenue: 0, orderSet: new Set() };
      return tsMap[day];
    };
    itemsTs.forEach((row) => {
      const day = row._id;
      if (!day) return;
      const slot = ensureDay(day);
      slot.revenue += Number(row.revenue || 0);
      (row.orders || []).forEach((id) => slot.orderSet.add(String(id)));
    });
    subOrdersTs.forEach((row) => {
      const day = row._id;
      if (!day) return;
      const slot = ensureDay(day);
      slot.revenue += Number(row.deliveryFee || 0);
      (row.orders || []).forEach((id) => slot.orderSet.add(String(id)));
    });

    const timeseries = Object.values(tsMap)
      .map((r) => ({
        day: r.day,
        revenue: r.revenue,
        orders: r.orderSet.size,
      }))
      .sort((a, b) => (a.day < b.day ? -1 : a.day > b.day ? 1 : 0));

    return res.json({
      success: true,
      data: {
        summary: {
          totalRevenue,
          totalOrders: totalOrdersSafe,
          avgOrderValue,
        },
        restaurants,
        timeseries,
      },
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Error" });
  }
};

export {
  placeOrder,
  placeOrderCOD,
  verifyOrder,
  userOrders,
  listOrders,
  updateStatus,
  updateDeliveryPhase,
  revenueMetrics,
}
