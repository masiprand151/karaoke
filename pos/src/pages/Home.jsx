import { useState } from "react";
import { FiClock } from "react-icons/fi";
import api from "../utils/api";
import { useEffect } from "react";
import CheckInModal from "../components/CheckInModal";
import RoomCard from "../components/RoomCard";

// const rooms = [
//   {
//     id: 1,
//     name: "Room 01",
//     status: "AVAILABLE",
//   },
//   {
//     id: 2,
//     name: "Room 02",
//     status: "OCCUPIED",
//     customer: "Andi",
//     remaining: "01:25:30",
//   },
//   {
//     id: 3,
//     name: "Room 03",
//     status: "AVAILABLE",
//   },
//   {
//     id: 4,
//     name: "Room 04",
//     status: "WARNING",
//     customer: "Budi",
//     remaining: "00:14:32",
//   },
//   {
//     id: 5,
//     name: "Room 05",
//     status: "AVAILABLE",
//   },
//   {
//     id: 6,
//     name: "Room 06",
//     status: "OCCUPIED",
//     customer: "Rina",
//     remaining: "00:52:10",
//   },
//   {
//     id: 7,
//     name: "Room 07",
//     status: "AVAILABLE",
//   },
//   {
//     id: 8,
//     name: "Room 08",
//     status: "MAINTENANCE",
//   },
//   {
//     id: 9,
//     name: "Room 09",
//     status: "AVAILABLE",
//   },
//   {
//     id: 10,
//     name: "Room 10",
//     status: "OCCUPIED",
//     customer: "Dimas",
//     remaining: "01:42:18",
//   },
//   {
//     id: 11,
//     name: "Room 11",
//     status: "AVAILABLE",
//   },
//   {
//     id: 12,
//     name: "Room 12",
//     status: "AVAILABLE",
//   },
//   {
//     id: 13,
//     name: "Room 13",
//     status: "WARNING",
//     customer: "Sinta",
//     remaining: "00:08:45",
//   },
//   {
//     id: 14,
//     name: "Room 14",
//     status: "AVAILABLE",
//   },
//   {
//     id: 15,
//     name: "Room 15",
//     status: "OCCUPIED",
//     customer: "Fajar",
//     remaining: "00:35:20",
//   },
//   {
//     id: 16,
//     name: "Room 16",
//     status: "AVAILABLE",
//   },
//   {
//     id: 17,
//     name: "Room 17",
//     status: "AVAILABLE",
//   },
//   {
//     id: 18,
//     name: "Room 18",
//     status: "OCCUPIED",
//     customer: "Agus",
//     remaining: "01:10:12",
//   },
//   {
//     id: 19,
//     name: "Room 19",
//     status: "AVAILABLE",
//   },
//   {
//     id: 20,
//     name: "Room 20",
//     status: "MAINTENANCE",
//   },
// ];

const statusConfig = {
  AVAILABLE: {
    label: "Available",
    className: "room-available",
  },

  OCCUPIED: {
    label: "Occupied",
    className: "room-occupied",
    classNameWarning: "room-warning",
  },

  MAINTENANCE: {
    label: "Maintenance",
    className: "room-maintenance",
  },
};

function Home() {
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);

  const getMonitoring = async () => {
    try {
      const result = await api.get("/room");
      console.log(result);

      setRooms(result?.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMonitoring();
  }, []);

  return (
    <>
      {/* ROOM HEADER */}
      <div className="room-header mb-2">
        <div>
          <h6 className="fw-bold mb-0">Room</h6>
        </div>

        <div className="room-legend">
          <span>
            <i className="legend-dot available" />
            Available
          </span>

          <span>
            <i className="legend-dot occupied" />
            Occupied
          </span>

          <span>
            <i className="legend-dot warning" />
            Warning
          </span>

          <span>
            <i className="legend-dot maintenance" />
            Maintenance
          </span>
        </div>
      </div>

      {/* ROOM GRID */}
      <div className="room-grid">
        {rooms.length > 0 &&
          rooms.map((room) => {
            const config = statusConfig[room?.status];
            return (
              <RoomCard
                key={room.id}
                setSelected={setSelected}
                room={room}
                config={config}
              />
            );
          })}
      </div>

      <CheckInModal
        show={Boolean(selected)}
        onClose={() => {
          setSelected(null);
          getMonitoring();
        }}
        room={selected}
      />
    </>
  );
}

export default Home;
