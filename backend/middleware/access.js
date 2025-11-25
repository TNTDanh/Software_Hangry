export const requireOwnerOrAdmin = (req, res, next) => {
  const user = req.user;
  if (!user) return res.status(401).json({ success: false, message: "Not authorized" });
  if (user.role === "admin") return next();

  const allowed = user.restaurantIds || [];
  const restaurantId =
    req.body.restaurantId ||
    req.query.restaurantId ||
    req.params.restaurantId ||
    req.body.id ||
    req.params.id ||
    req.query.id;

  if (user.role === "restaurantOwner") {
    if (!restaurantId || allowed.find((id) => id.toString() === restaurantId.toString())) {
      return next();
    }
    return res.status(403).json({ success: false, message: "Not allowed for this restaurant" });
  }
  return res.status(403).json({ success: false, message: "Not allowed" });
};

export const filterForOwner = (user, filter = {}, field = "restaurantId") => {
  if (user?.role === "restaurantOwner") {
    const allowed = user.restaurantIds || [];
    return { ...filter, [field]: { $in: allowed } };
  }
  return filter;
};
