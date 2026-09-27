import { useState } from "react";
import Navbar from "../components/Navbar";
import { useParams } from "react-router-dom";
import OrderProduct from "../components/OrderProduct";
import OrderCompanion from "../components/OrderCompanion";

export default function Order() {
  const { transactionId } = useParams();
  const [orderType, setOrderType] = useState("product");

  return (
    <>
      <Navbar title={`Order - ${transactionId}`} />
      <div className="p-2">
        <div className="mb-2">
          <ul className="nav nav-underline">
            <li className="nav-item">
              <button
                className={`nav-link ${orderType === "product" ? "active" : ""}`}
                onClick={() => setOrderType("product")}
              >
                Product
              </button>
            </li>
            <li className="nav-item">
              <button
                className={`nav-link ${orderType === "companion" ? "active" : ""}`}
                onClick={() => setOrderType("companion")}
              >
                Companion
              </button>
            </li>
          </ul>
        </div>

        {/* content */}
        {orderType === "product" && (
          <OrderProduct transactionId={transactionId} />
        )}
        {orderType === "companion" && <OrderCompanion />}
      </div>
    </>
  );
}
