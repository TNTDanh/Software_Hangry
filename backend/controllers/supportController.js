import supportTicketModel from "../models/supportTicketModel.js";

const createTicket = async (req, res) => {
  try {
    const { userId, orderId, subject, message } = req.body;
    if (!userId || !subject || !message) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }
    const ticket = await supportTicketModel.create({
      userId,
      orderId,
      subject,
      message,
    });
    return res.status(201).json({ success: true, data: ticket });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const listTickets = async (req, res) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.userId) filter.userId = req.query.userId;
    const tickets = await supportTicketModel.find(filter).sort({ createdAt: -1 });
    return res.json({ success: true, data: tickets });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const replyTicket = async (req, res) => {
  try {
    const { id, by, message } = req.body;
    if (!id || !by || !message) {
      return res.status(400).json({ success: false, message: "Missing fields" });
    }
    await supportTicketModel.findByIdAndUpdate(id, {
      $push: { replies: { by, message, at: new Date() } },
    });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

const updateTicketStatus = async (req, res) => {
  try {
    const { id, status } = req.body;
    if (!id || !status) {
      return res.status(400).json({ success: false, message: "Missing id/status" });
    }
    await supportTicketModel.findByIdAndUpdate(id, { status });
    return res.json({ success: true });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ success: false, message: "Error" });
  }
};

export { createTicket, listTickets, replyTicket, updateTicketStatus };
