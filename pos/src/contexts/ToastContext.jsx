import { Toast } from "bootstrap";
import { createContext, useEffect, useRef, useState } from "react";

export const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const toastRef = useRef(null);
  const bootstrapToast = useRef(null);

  const [data, setData] = useState({
    message: "",
    type: "success",
    show: false,
  });

  useEffect(() => {
    if (!toastRef.current) return;

    bootstrapToast.current = Toast.getOrCreateInstance(toastRef.current, {
      delay: 5000,
      autohide: true,
    });

    return () => {
      bootstrapToast.current?.dispose();
    };
  }, []);

  const showToast = (message, type = "success") => {
    setData({
      message,
      type,
      show: true,
    });

    setTimeout(() => {
      bootstrapToast.current?.show();
    }, 0);
  };

  const success = (message) => {
    showToast(message, "success");
  };
  const error = (message) => {
    showToast(message, "danger");
  };
  const info = (message) => {
    showToast(message, "info");
  };

  return (
    <ToastContext.Provider
      value={{
        showToast,
        success,
        error,
        info,
      }}
    >
      {children}

      <div className="toast-container position-fixed top-0 w-100">
        <div className="d-flex justify-content-center align-items-center w-100">
          <div
            ref={toastRef}
            className={`toast text-bg-${data.type} mt-4`}
            role="alert"
            aria-live="assertive"
            aria-atomic="true"
          >
            <div className="d-flex">
              <div className="toast-body">{data.message}</div>
              <button
                type="button"
                className="btn-close btn-close-white me-2 m-auto"
                data-bs-dismiss="toast"
                aria-label="Close"
              />
            </div>
          </div>
        </div>
      </div>
    </ToastContext.Provider>
  );
}
