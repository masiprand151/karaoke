import { useContext } from "react";
import { ToastContext } from "../contexts/ToastContext";

export default function useToast() {
  const context = useContext(ToastContext);
  return context;
}
