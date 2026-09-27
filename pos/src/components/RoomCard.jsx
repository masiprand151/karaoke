import { useEffect, useState } from "react";
import { formatDuration, getRemainingTime } from "../utils/remaining";
import { useNavigate } from "react-router-dom";
export default function RoomCard({ config, room, setSelected }) {
  const [remaining, setRemaining] = useState(null);
  const navigate = useNavigate();

  const transaction = room.transactions?.[0];
  useEffect(() => {
    if (!transaction) return;
    const interval = setInterval(() => {
      const r = getRemainingTime(transaction.startTime, transaction.endTime);
      setRemaining(r);
    }, 1000);

    return () => clearInterval(interval);
  });

  const statusColor = remaining?.warning
    ? config.classNameWarning
    : config.className;

  return (
    <div
      key={room.id}
      className={`room-card ${statusColor}`}
      onClick={() =>
        room?.transactions.length > 0
          ? navigate(`/billing/${room.id}`)
          : setSelected(room)
      }
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
