import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import api from "../utils/api";
import InputList from "../components/InputList";
import formatCurrency from "../utils/formatRupiah";
import useToast from "../hooks/useToast";
import { getRemainingTime } from "../utils/remaining";
import { BsPencilSquare, BsTrash } from "react-icons/bs";
import BaseModal from "../components/BaseModal";
import Count from "../components/Count";
import Receipt from "../components/Receipt";

export default function Billing() {
  const { roomId } = useParams();
  const [room, setRoom] = useState(null);
  const [remaining, setRemaining] = useState(null);
  const [selected, setSelected] = useState(null);
  const [newQty, setNewQty] = useState(0);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const toast = useToast();
  const [showReceipt, setShowReceipt] = useState(false);

  const getPreview = async () => {
    const res = await api.get(`/room/billing/${roomId}`);

    setRoom(res.data);
  };

  useEffect(() => {
    getPreview();
  }, [roomId]);

  const hour = Number(room?.transactions?.durationMinute) / 60;
  const extend = Number(room?.transactions?.extendDuration) / 60;

  const totalTime = hour + extend;

  const date = new Date(room?.transactions?.createdAt);

  const formatted = date.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const handleStopBill = async () => {
    try {
      const res = await api.patch(`/transaction/stop/${room.id}`);
      toast.success(res.message);
      navigate("/");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const productItems = room?.transactions?.orders
    .flatMap((order) => order.items)
    .filter((item) => item.type === "PRODUCT");
  const companionItems = useMemo(
    () =>
      room?.transactions?.orders
        .flatMap((order) => order.items)
        .filter((item) => item.type === "COMPANION") || [],
    [room?.transactions?.orders],
  );

  // remaining companion
  useEffect(() => {
    if (!companionItems?.length) {
      setRemaining({});
      return;
    }

    const updateRemaining = () => {
      const result = {};

      companionItems.forEach(async (companion) => {
        result[companion.name] = getRemainingTime(
          companion.startTime,
          companion.endTime,
        );

        if (result[companion.name].isExpired) {
          await api.post("/companion/stop", {
            id: companion.companionId,
            auto: true,
            password: null,
          });
        }
      });

      setRemaining(result);
    };

    updateRemaining();

    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [room?.transactions?.id]);

  const handleUpdateOrder = async () => {
    try {
      if (selected.type === "PRODUCT") {
        // product

        const data = {
          transactionId: room?.transactions?.id,
          password,
          items: [
            {
              productId: selected.productId,
              quantity: newQty,
              id: selected.id,
            },
          ],
        };

        const res = await api.patch(`/product/order`, data);
        toast.success(res.message);
        getPreview();
        setSelected(null);
        setPassword("");
      } else {
        // companion
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <div className="row p-2">
        <div className="col-4">
          <div className="card">
            <div className="card-body">
              <InputList title={"Number"} value={room?.transactions?.id} />
              <InputList title={"Date"} value={formatted} />
              <InputList
                title={"Name"}
                value={room?.transactions?.customerName}
              />
              <InputList
                title={"Type"}
                value={room?.transactions?.roomPrice.dayType}
              />
              <InputList title={"Status"} value={room?.transactions?.status} />
              <InputList
                title={"Duration"}
                onUpdate={() => {}}
                value={hour || "0"}
              />
              <InputList
                title={"Extra time"}
                onUpdate={() => {}}
                value={extend || "0"}
              />
              <InputList
                title={"Total time"}
                onUpdate={() => {}}
                value={totalTime || "0"}
              />

              <hr style={{ margin: 4 }} />

              <InputList
                title={"Sub Room"}
                value={formatCurrency(
                  Number(room?.transactions?.roomTotal),
                  "IDR",
                )}
              />
              <InputList
                title={"Discount Room"}
                value={room?.transactions?.disAmount}
                onUpdate={() => {}}
              />
              <InputList title={"Tax"} value={room?.transactions?.tax} />
              <InputList
                title={"Service"}
                value={room?.transactions?.service}
              />
            </div>
            <div className="card">
              <div className="card-body">
                <InputList
                  title={"Room"}
                  value={formatCurrency(
                    Number(room?.transactions?.roomTotal) -
                      Number(room?.transactions?.disAmount),
                    "IDR",
                  )}
                />
                <InputList
                  title={"Fnb"}
                  value={formatCurrency(
                    Number(room?.transactions?.fnbTotal),
                    "IDR",
                  )}
                />
                <InputList
                  title={"Companion"}
                  value={formatCurrency(
                    Number(room?.transactions?.companionTotal),
                    "IDR",
                  )}
                />
                <InputList
                  title={"Grand Total"}
                  value={formatCurrency(
                    Number(room?.transactions?.grandTotal),
                    "IDR",
                  )}
                />
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card-body">
              <div className="d-flex justify-content-center gap-1 mb-2">
                <button
                  className="btn btn-sm btn-dark action-btn"
                  onClick={handleStopBill}
                >
                  Stop Bill
                </button>

                <button className="btn btn-sm btn-dark action-btn">
                  Pending
                </button>

                <button
                  className="btn btn-sm btn-dark action-btn"
                  onClick={() => setShowReceipt(true)}
                >
                  Preview
                </button>

                <button className="btn btn-sm btn-dark action-btn">
                  Free Minute
                </button>
              </div>

              <div className="d-flex justify-content-center gap-1">
                <button
                  className="btn btn-sm btn-dark action-btn"
                  onClick={() => navigate(`/order/${room.transactions.id}`)}
                >
                  Order
                </button>

                <button className="btn btn-sm btn-dark action-btn">
                  Move Room
                </button>

                <button
                  className="btn btn-sm btn-dark action-btn"
                  onClick={() => navigate(`/payment/${room.id}`)}
                >
                  Payment
                </button>

                <button
                  className="btn btn-sm btn-dark action-btn"
                  onClick={() => navigate(-1)}
                >
                  Back
                </button>
              </div>
            </div>
          </div>
        </div>
        <div className="col-8">
          {/* detail order */}
          <div className="d-flex flex-column h-100 gap-2">
            <div className="card flex-fill">
              <div className="card-header">
                <span className="card-title">Fnb Order</span>
              </div>

              <div className="card-body">
                <table className="table table-sm table-hover mb-0">
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      backgroundColor: "#fff",
                    }}
                  >
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Name</th>
                      <th scope="col">Price</th>
                      <th scope="col">Qty</th>
                      <th scope="col">Subtotal</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {productItems &&
                      productItems.map((item, i) => (
                        <tr key={item.id}>
                          <th scope="row">{i + 1}</th>
                          <td>{item.name}</td>
                          <td>{formatCurrency(item.unitPrice, "IDR")}</td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.subtotal, "IDR")}</td>
                          <td>
                            <button
                              className="btn btn-sm btn-primary"
                              onClick={() => {
                                setSelected(item);
                                setNewQty(item.quantity);
                              }}
                            >
                              <BsPencilSquare />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="card flex-fill">
              <div className="card-header">
                <span className="card-title">Companion Order</span>
              </div>

              <div className="card-body">
                <table className="table table-sm table-hover mb-0">
                  <thead
                    style={{
                      position: "sticky",
                      top: 0,
                      zIndex: 10,
                      backgroundColor: "#fff",
                    }}
                  >
                    <tr>
                      <th scope="col">#</th>
                      <th scope="col">Name</th>
                      <th scope="col">Price</th>
                      <th scope="col">duration</th>
                      <th scope="col">remaining</th>
                      <th scope="col">subtotal</th>
                      <th scope="col"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {companionItems &&
                      companionItems.map((item, i) => {
                        const time = remaining?.[item.name];

                        return (
                          <tr key={item.id}>
                            <th scope="row">{i + 1}</th>
                            <td>{item.name}</td>
                            <td>{formatCurrency(item.unitPrice, "IDR")}</td>
                            <td>{item.quantity}</td>
                            <td>{time?.remainingText}</td>
                            <td>{formatCurrency(item.subtotal, "IDR")}</td>
                            <td>
                              <button
                                className="btn btn-sm btn-primary"
                                onClick={() => {
                                  setSelected(item);
                                  setNewQty(item.quantity);
                                }}
                              >
                                <BsPencilSquare />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* edit order */}
      <BaseModal
        show={Boolean(selected)}
        onClose={() => {
          setSelected(null);
        }}
        title={`Update ${selected?.type.toUpperCase()}`}
        footer={
          <>
            <button className="btn btn-primary" onClick={handleUpdateOrder}>
              Save
            </button>
          </>
        }
      >
        <Count
          value={newQty}
          onMin={() => {
            setNewQty((prev) => (prev <= 0 ? 0 : prev - 1));
          }}
          onPlus={() => {
            setNewQty((prev) => (prev >= 10 ? 10 : prev + 1));
          }}
        />

        <div className="mb-3">
          <input
            type="password"
            className="form-control"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            disabled={newQty >= selected?.quantity}
          />
        </div>
      </BaseModal>

      <Receipt
        data={room}
        showReceipt={showReceipt}
        setShowReceipt={setShowReceipt}
      />
    </>
  );
}
