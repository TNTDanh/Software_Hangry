import React, { useContext, useEffect, useRef, useState } from "react";
import "./MyOrders.css";
import { StoreContext } from "../../context/StoreContext";
import axios from "axios";
import { assets } from "../../assets/assets";

const MyOrders = () => {
  const { url, token } = useContext(StoreContext);
  const [data, setData] = useState([]);

  // Trỏ tới đơn cuối cùng
  const latestRef = useRef(null);

  const fetchOrders = async () => {
    try {
      const res = await axios.post(
        `${url}/api/order/userorders`,
        {},
        { headers: { token } }
      );
      const arr = Array.isArray(res.data?.data) ? res.data.data : [];
      // Không sort: giữ nguyên thứ tự API (đơn mới ở cuối)
      setData(arr);
    } catch {
      setData([]);
    }
  };

  useEffect(() => {
    if (token) fetchOrders();
  }, [token]);

  const scrollToLatest = () => {
  const el = latestRef.current;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const extra = 120; // muốn chừa 120px
  const rawTarget = rect.bottom + window.pageYOffset - window.innerHeight + extra;
  const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
  const target = Math.max(0, Math.min(rawTarget, maxScroll));

  window.scrollTo({ top: target, behavior: 'smooth' });
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 900);
};


  return (
    <div className="my-orders">
      <div className="myorders-toolbar">
        <p className="myorders-hint">
          Your recent orders are at the bottom of the list...
        </p>
        <button
          className="jump-pill"
          onClick={scrollToLatest}
          title="Scroll to recent orders"
          aria-label="Scroll to recent orders"
        >
          Recent Order 👇
        </button>
      </div>

      <h2 className="myordersp">My Orders</h2>

      <div className="container">
        {data.map((order, index) => {
          const isLast = index === data.length - 1;
          const items = Array.isArray(order?.items) ? order.items : [];
          const status = (order?.status || "Food Processing").toLowerCase();
          let statusClass = "status-processing";
          if (status.includes("out for delivery")) statusClass = "status-out";
          else if (status.includes("delivered"))
            statusClass = "status-delivered";

          return (
            <div
              key={order?._id || index}
              className="my-orders-order"
              ref={isLast ? latestRef : null}
            >
              <img src={assets.parcel_icon} alt="" />
              <p>
                {items.map((item, i) => {
                  const piece = `${item?.name || "Item"} x ${
                    item?.quantity ?? 0
                  }`;
                  return i === items.length - 1 ? piece : piece + ", ";
                })}
              </p>
              <p>${Number(order?.amount ?? 0)}</p>
              <p>Items: {items.length}</p>
              <p className="status-cell">
                <span className={`status-badge ${statusClass}`}>
                  <span className="dot" aria-hidden />
                  {order?.status || "Food Processing"}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;
