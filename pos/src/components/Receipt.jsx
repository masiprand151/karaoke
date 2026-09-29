import { useRef } from "react";
import formatCurrency from "../utils/formatRupiah";
import BaseModal from "./BaseModal";

export default function Receipt({ data, showReceipt, setShowReceipt }) {
  const transaction = data?.transactions || data;
  const receiptRef = useRef(null);

  const orders = transaction?.orders || [];

  const rawItems = orders.flatMap((order) => order.items || []);

  const items = Object.values(
    rawItems.reduce((acc, item) => {
      const key = item.productId || item.name;

      if (!acc[key]) {
        acc[key] = {
          ...item,
          quantity: Number(item.quantity || 0),
          subtotal: Number(item.subtotal || 0),
        };
      } else {
        acc[key].quantity += Number(item.quantity || 0);
        acc[key].subtotal += Number(item.subtotal || 0);
      }

      return acc;
    }, {}),
  );

  const formatRupiah = (value) => {
    return formatCurrency(value, "IDR");
  };

  const totalMinute = transaction?.durationMinute + transaction?.extendDuration;
  const totalHour = totalMinute / 60;

  const printReceipt = async () => {
    const receipt = receiptRef.current;

    if (!receipt) return;

    const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">

        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }

          html,
          body {
            margin: 0;
            padding: 0;
            width: 80mm;
          }

          body {
            font-family: "Courier New", monospace;
            background: white;
            color: black;
          }

          .receipt {
            width: 80mm;
            box-sizing: border-box;
            padding: 4mm;
            font-size: 12px;
            line-height: 1.35;
          }

          .receipt-center {
            text-align: center;
          }

          .receipt-title {
            font-size: 18px;
            font-weight: bold;
          }

          .receipt-divider {
            border: 0;
            border-top: 1px dashed #000;
            margin: 6px 0;
          }

          .receipt-item {
            margin-bottom: 5px;
          }

          .item-name {
            font-weight: bold;
          }

          .item-detail {
            display: grid;
            grid-template-columns: 1fr 80px;
            column-gap: 8px;
          }

          .item-detail span:last-child {
            text-align: right;
            white-space: nowrap;
          }

          .receipt-row {
            display: grid;
            grid-template-columns: 1fr auto 90px;
            column-gap: 8px;
            margin-bottom: 3px;
          }

          .receipt-row span:last-child {
            text-align: right;
            white-space: nowrap;
          }

          .receipt-grand-total {
            display: grid;
            grid-template-columns: 1fr auto 90px;
            column-gap: 8px;
            margin-top: 6px;
            padding-top: 6px;
            border-top: 1px dashed #000;
            font-weight: bold;
            font-size: 14px;
          }

          .receipt-grand-total span:last-child {
            text-align: right;
            white-space: nowrap;
          }

          .receipt-footer {
            margin-top: 15px;
            text-align: center;
          }
        </style>
      </head>

      <body>
        ${receipt.outerHTML}
      </body>
    </html>
  `;
    try {
      const result = await window.electron.printReceipt({
        html,
        target: "cashier",
      });

      console.log("Print result:", result);
    } catch (error) {
      console.error("Print error:", error);
    }
  };

  return (
    <BaseModal
      show={showReceipt}
      title={"Preview"}
      onClose={() => setShowReceipt(false)}
      footer={
        <>
          <button
            className="btn btn-primary"
            onClick={() => {
              printReceipt();
            }}
          >
            Print
          </button>
        </>
      }
    >
      <div className="receipt" ref={receiptRef}>
        {/* HEADER */}
        <div className="receipt-center">
          <div className="receipt-title">KARAOKEPRO</div>

          <div>POS SYSTEM</div>
          <div>Jl. Contoh No. 123</div>
          <div>Telp. 08123456789</div>
        </div>

        <hr className="receipt-divider" />

        {/* TRANSACTION */}
        <div>
          <div>Invoice : {transaction?.id}</div>

          <div>
            Room : {data?.name} - {transaction?.roomPrice.dayType}
          </div>

          <div>Customer: {transaction?.customerName}</div>

          <div>Cashier : {transaction?.cashier}</div>

          <div>
            Date :{" "}
            {transaction?.createdAt
              ? new Date(transaction.createdAt).toLocaleString("id-ID")
              : "-"}
          </div>
        </div>

        <hr className="receipt-divider" />

        {/* ITEMS */}

        <div className="receipt-items">
          {items.map((item) => (
            <div key={item.id} className="receipt-item">
              <div className="item-name">{item.name}</div>

              <div className="item-detail">
                <span>
                  {item.quantity} x {formatRupiah(item.unitPrice)}
                </span>

                <span>{formatRupiah(item.subtotal)}</span>
              </div>
            </div>
          ))}
        </div>

        <hr className="receipt-divider" />

        {/* TOTAL */}

        <div className="receipt-total">
          <div className="receipt-row">
            <span>Room</span>
            <span>{totalHour} jam</span>
            <span>{formatRupiah(transaction?.roomTotal)}</span>
          </div>

          <div className="receipt-row">
            <span>F&B</span>
            <span></span>
            <span>{formatRupiah(transaction?.fnbTotal)}</span>
          </div>

          {Number(transaction?.packageTotal) > 0 && (
            <div className="receipt-row">
              <span>Package</span>
              <span>nama pkg</span>
              <span>{formatRupiah(transaction.packageTotal)}</span>
            </div>
          )}

          {Number(transaction?.companionTotal) > 0 && (
            <div className="receipt-row">
              <span>Companion</span>
              <span></span>
              <span>{formatRupiah(transaction.companionTotal)}</span>
            </div>
          )}

          <div className="receipt-row">
            <span>Subtotal</span>
            <span></span>
            <span>{formatRupiah(transaction?.subTotal)}</span>
          </div>

          {Number(transaction?.disAmount) > 0 && (
            <div className="receipt-row">
              <span>Discount</span>
              <span></span>
              <span>- {formatRupiah(transaction.disAmount)}</span>
            </div>
          )}

          <div className="receipt-row">
            <span>Tax</span>
            <span></span>
            <span>{formatRupiah(transaction?.tax)}</span>
          </div>

          <div className="receipt-row">
            <span>Service</span>
            <span></span>
            <span>{formatRupiah(transaction?.service)}</span>
          </div>

          <div className="receipt-grand-total">
            <span>TOTAL</span>
            <span></span>
            <span>{formatRupiah(transaction?.grandTotal)}</span>
          </div>
        </div>

        <hr className="receipt-divider" />

        <div className="receipt-center receipt-footer">
          <div>Terima kasih</div>
        </div>
      </div>
    </BaseModal>
  );
}
