import { BsPlus, BsDash } from "react-icons/bs";

export default function Count({
  value,
  onMin,
  onPlus,
  label,
  className,
  disabled = true,
  onChange,
}) {
  return (
    <div className={className}>
      <label className="form-label">{label}</label>
      <div className="input-group mb-3">
        <button
          className="input-group-text btn btn-outline-secondary"
          onClick={onMin}
        >
          <BsDash />
        </button>
        <input
          type="number"
          className="form-control text-center"
          disabled={disabled}
          value={value}
          onChange={onChange}
        />
        <button
          className="input-group-text btn btn-outline-secondary"
          onClick={onPlus}
        >
          <BsPlus />
        </button>
      </div>
    </div>
  );
}
