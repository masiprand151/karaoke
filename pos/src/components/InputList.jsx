import { BsPencilSquare } from "react-icons/bs";

export default function InputList({
  title,
  value,
  onUpdate,
  onDiscount,
  type = "start",
}) {
  return (
    <div className="input-group input-group-sm mb-1">
      <span className="input-group-text" style={{ width: "150px" }}>
        {title}
      </span>
      {Boolean(onUpdate) && (
        <button
          className="btn btn-secondary input-group-text"
          onClick={onUpdate}
        >
          <BsPencilSquare />
        </button>
      )}
      {Boolean(onDiscount) && <span className="input-group-text">Disc</span>}
      <input
        type="text"
        className={`form-control text-${type}`}
        disabled
        value={value || ""}
      />
    </div>
  );
}
