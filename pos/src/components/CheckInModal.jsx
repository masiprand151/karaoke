import { useState } from "react";
import BaseModal from "./BaseModal";
import Count from "./Count";
import formatCurrency from "../utils/formatRupiah";
import useToast from "../hooks/useToast";
import api from "../utils/api";
import useStorage from "../hooks/useStorage";

export default function CheckInModal({ show, onClose, room }) {
  const [user, setUser, removeUser] = useStorage("user");
  const [type, setType] = useState("REGULAR");
  const [customer, setCustomer] = useState("");
  const [duration, setDuration] = useState(1);
  const [people, setPeople] = useState(1);
  const toast = useToast();

  const handleMin = () => {
    setDuration((prev) => (prev <= 1 ? 1 : prev - 1));
  };
  const handlePlus = () => {
    setDuration((prev) => (prev >= 10 ? 10 : prev + 1));
  };

  const handleMinPeople = () => {
    setPeople((prev) => (prev <= 1 ? 1 : prev - 1));
  };
  const handlePlusPeople = () => {
    setPeople((prev) => (prev >= 20 ? 20 : prev + 1));
  };

  const priceFilter = room?.roomPrices?.find((p) => p.dayType === type);

  const handleCheckin = async () => {
    try {
      const data = {
        roomId: Number(room?.id),
        customerName: customer,
        duration: Number(duration) * 60,
        people: Number(people),
        cashier: user?.username,
      };

      const res = await api.post("/transaction/checkin", data);
      setCustomer("");
      setDuration(1);
      setPeople(1);
      setType("REGULAR");
      onClose?.();
      toast.success(res.message);
    } catch (error) {
      toast.error(error.message);
    }
  };
  return (
    <BaseModal show={show} onClose={onClose} title={`CHECK IN - ${room?.name}`}>
      <select
        className="form-select mb-3"
        aria-label="Default select example"
        value={type}
        onChange={(e) => setType(e.target.value)}
      >
        <option value="REGULAR">REGULAR</option>
        <option value="PACKAGE">PACKAGE</option>
        <option value="PROMO">PROMO</option>
        <option value="PROMO">WEEKEND</option>
      </select>

      <div className="mb-3">
        <label className="form-label">Customer</label>
        <input
          className="form-control"
          type="text"
          value={customer}
          onChange={(e) => setCustomer(e.target.value?.toUpperCase())}
        />
      </div>
      <div className="mb-3">
        <label className="form-label">Rate</label>
        <input
          className="form-control"
          type="text"
          value={formatCurrency(priceFilter?.price, "IDR")}
          disabled
        />
      </div>

      <Count
        label={"Duration"}
        className={"mb-3"}
        value={duration}
        onMin={handleMin}
        onPlus={handlePlus}
      />
      <Count
        label={"Number of people"}
        className={"mb-3"}
        value={people}
        onMin={handleMinPeople}
        onPlus={handlePlusPeople}
        disabled={false}
        onChange={(e) => {
          const v =
            e.target.value <= 1
              ? 1
              : e.target.value >= 25
                ? 20
                : e.target.value;

          setPeople(v);
        }}
      />

      <div className="mb-3">
        <button className="btn btn-success w-100" onClick={handleCheckin}>
          OPEN
        </button>
      </div>
    </BaseModal>
  );
}
