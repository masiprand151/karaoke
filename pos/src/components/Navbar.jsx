import { FiArrowLeft } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

export default function Navbar({ title }) {
  const navigate = useNavigate();
  return (
    <header className="pos-header">
      <div className="d-flex gap-3 justify-content-center align-items-center">
        <button className="btn" onClick={() => navigate(-1)}>
          <FiArrowLeft />
        </button>
        <h5 className="mb-1 fw-bold">{title}</h5>
      </div>
    </header>
  );
}
