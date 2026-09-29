import React from "react";
import { useState } from "react";
import api from "../utils/api";
import { useEffect } from "react";
import formatCurrency from "../utils/formatRupiah";
import BaseModal from "./BaseModal";
import Count from "./Count";
import useToast from "../hooks/useToast";
import { useNavigate } from "react-router-dom";

export default function OrderCompanion({ transactionId }) {
  const [search, setSearch] = useState("");
  const [companions, setCompanions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const toast = useToast();
  const navigate = useNavigate();

  const getCompanions = async (q = "") => {
    try {
      const res = await api.get(`/companion?search=${q}`);
      console.log(res);
      setCompanions(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getCompanions(search);
  }, [search]);

  const handleOrder = async () => {
    try {
      const res = await api.post("/companion/order", {
        ladyId: Number(selected.id),
        transactionId,
        duration: quantity,
      });

      toast.success(res.message);
      setSelected(null);
      setQuantity(1);
      getCompanions("");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <>
      <div className="row">
        <div className="col">
          <div className="card-header">
            <div
              className="input-group input-group-sm mb-2"
              style={{
                width: "40%",
              }}
            >
              <input
                className="form-control form-control-sm "
                type="search"
                placeholder="Search"
                aria-label="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              <button
                className="btn btn-secondary btn-sm input-group-text"
                onClick={() => getCompanions(search)}
              >
                Search
              </button>
            </div>
          </div>

          <div className="card-body p-0">
            <div
              style={{
                height: 589,
                overflowY: "auto",
              }}
            >
              <table className="table table-hover mb-0">
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
                    <th scope="col">status</th>
                  </tr>
                </thead>
                <tbody>
                  {companions?.map((item, i) => (
                    <tr key={i} onClick={() => setSelected(item)}>
                      <th scope="row">{i + 1}</th>
                      <td>{item.name}</td>
                      <td>{formatCurrency(item.price, "IDR")}</td>
                      <td>
                        <span
                          className={
                            item.status === "AVAILABLE" ? "" : "text-danger"
                          }
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <BaseModal
        show={Boolean(selected)}
        title={`Duration order - ${selected?.name}`}
        onClose={() => {
          setSelected(null);
        }}
        footer={
          <>
            <button className="btn btn-dark" onClick={handleOrder}>
              Submit
            </button>
          </>
        }
      >
        <Count
          value={quantity}
          onMin={() => {
            setQuantity((prev) => (prev <= 1 ? 1 : prev - 1));
          }}
          onPlus={() => {
            setQuantity((prev) => (prev >= 10 ? 10 : prev + 1));
          }}
        />
      </BaseModal>
    </>
  );
}
