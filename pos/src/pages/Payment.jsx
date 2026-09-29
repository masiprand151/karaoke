import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import { useEffect, useState } from "react";
import { FiCreditCard, FiDollarSign, FiCheckCircle } from "react-icons/fi";
import api from "../utils/api";
import useToast from "../hooks/useToast";

export default function Payment() {
  const { roomId } = useParams();
  const [method, setMethod] = useState("CASH");
  const [loading, setLoading] = useState(false);
  const [transaction, setTransaction] = useState();
  const [type, setType] = useState("FINAL");
  const [amount, setAmount] = useState("");
  const toast = useToast();

  useEffect(() => {
    (async () => {
      const res = await api.get(`/room/billing/${roomId}`);

      setTransaction(res.data.transactions);
    })();
  }, [roomId]);

  const grandTotal = Number(transaction?.grandTotal || 0);

  const payments = transaction?.payments || [];

  const paidTotal = payments
    .filter((payment) => payment.status === "PAID")
    .reduce((total, payment) => total + Number(payment.amount || 0), 0);

  const remaining = Math.max(0, grandTotal - paidTotal);

  const paymentAmount = Number(amount || 0);

  const change = method === "CASH" ? Math.max(0, paymentAmount - remaining) : 0;

  useEffect(() => {
    if (remaining > 0) {
      setAmount(remaining);
    }
  }, [remaining]);

  const formatMoney = (value) => {
    return new Intl.NumberFormat("id-ID").format(value);
  };

  const handleTypeChange = (value) => {
    setType(value);

    if (value === "FINAL") {
      setAmount(remaining);
    }

    if (value === "DOWN_PAYMENT") {
      setAmount("");
    }

    if (value === "PARTIAL") {
      setAmount("");
    }
  };

  const handlePayment = async () => {
    if (!transaction?.id) return;

    if (paymentAmount <= 0) {
      toast.error("Enter the payment amount");
      return;
    }

    setLoading(true);

    try {
      const result = await api.post(`/transaction/${transaction.id}/payment`, {
        type,
        method,
        amount: paymentAmount,
      });

      toast.success(result.message);
      // print
    } catch (error) {
      console.error(error);

      toast.error(error?.message || "Pembayaran gagal");
    } finally {
      setLoading(false);
    }
  };
  return (
    <>
      <Navbar title={`Payment - ${transaction?.id}`} />
      <div className="container vh-100">
        <div className="card border-0 shadow-sm">
          <div className="card-body p-4">
            {/* SUMMARY */}
            <div className="mb-4">
              <div className="d-flex justify-content-between mb-2">
                <span>Total Bill</span>

                <strong>Rp {formatMoney(grandTotal)}</strong>
              </div>

              <div className="d-flex justify-content-between mb-2">
                <span>Already Paid</span>

                <strong className="text-success">
                  Rp {formatMoney(paidTotal)}
                </strong>
              </div>

              <hr />

              <div className="d-flex justify-content-between">
                <span className="fw-bold">Sisa Tagihan</span>

                <strong className="fs-5">Rp {formatMoney(remaining)}</strong>
              </div>
            </div>

            {/* TYPE */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Jenis Pembayaran</label>

              <div className="row g-2">
                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 ${
                      type === "FINAL" ? "btn-primary" : "btn-outline-secondary"
                    }`}
                    onClick={() => handleTypeChange("FINAL")}
                  >
                    Repayment
                  </button>
                </div>
                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 ${
                      type === "DOWN_PAYMENT"
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => handleTypeChange("DOWN_PAYMENT")}
                  >
                    Pay upfront
                  </button>
                </div>

                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 ${
                      type === "PARTIAL"
                        ? "btn-primary"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => handleTypeChange("PARTIAL")}
                  >
                    Some
                  </button>
                </div>
              </div>
            </div>

            {/* METHOD */}
            <div className="mb-4">
              <label className="form-label fw-semibold">Payment Method</label>

              <div className="row g-2">
                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-3 ${
                      method === "CASH"
                        ? "btn-success"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setMethod("CASH")}
                  >
                    <FiDollarSign size={20} />

                    <div>Cash</div>
                  </button>
                </div>

                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-3 ${
                      method === "TRANSFER"
                        ? "btn-success"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setMethod("TRANSFER")}
                  >
                    <FiCreditCard size={20} />

                    <div>Transfer</div>
                  </button>
                </div>

                <div className="col-4">
                  <button
                    type="button"
                    className={`btn w-100 py-3 ${
                      method === "QRIS"
                        ? "btn-success"
                        : "btn-outline-secondary"
                    }`}
                    onClick={() => setMethod("QRIS")}
                  >
                    <FiCreditCard size={20} />

                    <div>QRIS</div>
                  </button>
                </div>
              </div>
            </div>

            {/* AMOUNT */}
            <div className="mb-3">
              <label className="form-label fw-semibold">Payment Amount</label>

              <div className="input-group input-group-lg">
                <span className="input-group-text">Rp</span>

                <input
                  type="number"
                  className="form-control"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0"
                />
              </div>
            </div>

            {/* CHANGE */}
            {method === "CASH" && paymentAmount > remaining && (
              <div className="alert alert-success d-flex justify-content-between">
                <span>Change</span>

                <strong>Rp {formatMoney(change)}</strong>
              </div>
            )}

            {/* PAYMENT BUTTON */}
            <button
              type="button"
              className="btn btn-primary btn-lg w-100"
              disabled={loading || remaining <= 0 || paymentAmount <= 0}
              onClick={handlePayment}
            >
              <FiCheckCircle className="me-2" />

              {loading ? "Proccess..." : "Payment"}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
