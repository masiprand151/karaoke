import { HashRouter, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Layout from "./pages/Layout";
import Home from "./pages/Home";
import RoomPrice from "./pages/Master/RoomPrice";
import Billing from "./pages/Billing";

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/room-price" element={<RoomPrice />} />
        <Route path="/billing/:roomId" element={<Billing />} />
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
        </Route>
      </Routes>
    </HashRouter>
  );
}
