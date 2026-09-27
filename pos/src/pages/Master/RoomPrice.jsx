import { useEffect, useState } from "react";
import Navbar from "../../components/Navbar";
import api from "../../utils/api";

export default function RoomPrice() {
  const [rooms, setRooms] = useState([]);
  const [selected, setSelected] = useState(null);

  const getMonitoring = async () => {
    try {
      const result = await api.get("/room");
      setRooms(result?.data);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    getMonitoring();
  }, []);

  return (
    <div
      style={{
        height: "100vh",
        overflowY: "auto",
      }}
    >
      {/* NAVBAR */}
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 9999,
          background: "var(--bs-body-bg)",
        }}
      >
        <Navbar title="Room" />
      </div>

      {/* CONTENT */}
      <div
        style={{
          paddingTop: "60px",
        }}
      >
        <div className="row">
          <div className="col">
            <div className="p-3">
              <table className="table" style={{ height: 720 }}>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Name</th>
                    <th>Type</th>
                  </tr>
                </thead>

                <tbody>
                  {rooms?.map((room, index) => (
                    <tr key={room.id || index}>
                      <th>{index + 1}</th>
                      <td>{room?.name}</td>
                      <td>{room?.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="col">2</div>
        </div>
      </div>
    </div>
  );
}
