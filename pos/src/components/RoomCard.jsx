import { useEffect, useState } from "react";
import { formatDuration, getRemainingTime } from "../utils/remaining";
import { useNavigate } from "react-router-dom";
import api from "../utils/api";

export default function RoomCard({ config, room, setSelected }) {
  const [remaining, setRemaining] = useState(null);
  const [statusColor, setStatusColor] = useState(config.className);
  const navigate = useNavigate();

  const transaction = room.transactions?.[0];

  useEffect(() => {
    if (!transaction) return;

    const interval = setInterval(async () => {
      const r = getRemainingTime(transaction.startTime, transaction.endTime);

      if (r.isExpired) {
        setStatusColor("room-danger");

        if (transaction.status !== "CLOSE") {
          try {
            await api.post(`/transaction/${transaction.id}/close`);

            console.log("Transaction otomatis di-close");
          } catch (error) {
            console.error("Gagal close transaction:", error);
          }
        }

        return;
      }

      if (r.warning) {
        setStatusColor("room-warning");
      }

      setRemaining(r);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const handleClickRoom = () => {
    if (room?.transactions.length > 0) {
      if (transaction.status === "CLOSE") {
        console.log("payment");
      } else {
        navigate(`/billing/${room.id}`);
      }
      return;
    } else {
      setSelected(room);
    }
  };

  return (
    <div
      key={room.id}
      className={`room-card ${statusColor}`}
      onClick={handleClickRoom}
    >
      <div className="room-card-header">
        <span className="room-name">{room.name}</span>

        <span className="room-status">{config.label}</span>
      </div>

      <div className="room-body">
        {room.status === "AVAILABLE" && (
          <div className="room-action">Click to check in</div>
        )}

        {room.status === "OCCUPIED" && (
          <>
            <div className="customer-name">{transaction?.customerName}</div>

            <div className="room-timer">{remaining?.remainingText}</div>
          </>
        )}

        {room.status === "MAINTENANCE" && (
          <div className="room-action">Room tidak tersedia</div>
        )}
      </div>
    </div>
  );
}
