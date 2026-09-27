import { useEffect, useRef } from "react";
import { Modal } from "bootstrap";

export default function BaseModal({
  show = false,
  onClose,
  title,
  children,
  size = "",
  footer = null,
  centered = true,
  backdrop = false,
  keyboard = true,
}) {
  const modalRef = useRef(null);
  const modalInstance = useRef(null);

  useEffect(() => {
    if (!modalRef.current) return;

    modalInstance.current = Modal.getOrCreateInstance(modalRef.current, {
      backdrop,
      keyboard,
    });

    const handleHidden = () => {
      onClose?.();
    };

    modalRef.current.addEventListener("hidden.bs.modal", handleHidden);

    return () => {
      modalRef.current?.removeEventListener("hidden.bs.modal", handleHidden);

      modalInstance.current?.dispose();
    };
  }, []);

  useEffect(() => {
    if (!modalInstance.current) return;

    if (show) {
      modalInstance.current?.show();
    } else {
      modalInstance.current?.hide();
    }
  }, [show]);

  return (
    <div ref={modalRef} className="modal fade" tabIndex="-1" aria-hidden="true">
      <div
        className={`modal-dialog ${
          size ? `modal-${size}` : ""
        } ${centered ? "modal-dialog-centered" : ""}`}
      >
        <div className="modal-content">
          {/* HEADER */}
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>

            <button
              type="button"
              className="btn-close"
              onClick={() => onClose?.()}
              aria-label="Close"
            />
          </div>

          {/* BODY */}
          <div className="modal-body">{children}</div>

          {/* FOOTER */}
          {footer && <div className="modal-footer">{footer}</div>}
        </div>
      </div>
    </div>
  );
}
