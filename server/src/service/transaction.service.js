const prisma = require("../lib/prisma");
const AppError = require("../lib/app.error");
const { generateInvoiceNumber } = require("../util/invoice");
const { calculateBilling } = require("../util/billing");

const checkin = async ({
  customerName,
  duration,
  people,
  type,
  roomId,
  cashier,
}) => {
  const result = await prisma.$transaction(async (trx) => {
    if (!customerName) {
      throw new AppError(400, "Customer name not be empty");
    }

    const pricing = await trx.roomPrice.findFirst({
      where: {
        dayType: type,
      },
    });

    if (!pricing) {
      throw new AppError(400, "Pleace check the pricing");
    }

    const room = await trx.room.findUnique({
      where: {
        id: Number(roomId),
      },
    });

    if (!room) {
      throw new AppError(404, "Room not found");
    }

    if (room.status !== "AVAILABLE") {
      throw new AppError(404, "Pleace check the room in use or not");
    }

    const startTime = new Date();
    const endTime = new Date(startTime.getTime() + duration * 60000);
    const durationHour = duration / 60;
    const roomTotal = Number(pricing.price) * durationHour;

    const setting = await trx.setting.findUnique({
      where: {
        isActive: true,
      },
    });

    const tax = (roomTotal * setting.taxPercent) / 100;
    const service = (roomTotal * setting.servicePercent) / 100;

    const grandTotal = roomTotal + tax + service;

    const inv = await generateInvoiceNumber(trx);

    const transaction = await trx.transaction.create({
      data: {
        id: inv,
        customerName,
        durationMinute: duration,
        startTime,
        endTime,
        roomTotal,
        subTotal: roomTotal,
        tax,
        service,
        grandTotal,
        people,
        cashier,
        priceId: pricing.id,
        roomId: room.id,
      },
    });

    await trx.room.update({
      where: {
        id: room.id,
      },
      data: {
        status: "OCCUPIED",
      },
    });

    return transaction;
  });

  return result;
};

const extendDuration = async ({ transactionId, duration }) => {
  const result = await prisma.$transaction(async (tx) => {
    // =========================================
    // VALIDASI
    // =========================================

    if (!transactionId) {
      throw new AppError(400, "Transaction ID is required");
    }

    const extendMinute = Number(duration);

    if (!Number.isInteger(extendMinute)) {
      throw new AppError(400, "Duration must be 0 or greater");
    }

    // =========================================
    // GET TRANSACTION
    // =========================================

    const transaction = await tx.transaction.findUnique({
      where: {
        id: transactionId,
      },
    });

    if (!transaction) {
      throw new AppError(404, "Transaction not found");
    }

    if (transaction.status === "CLOSE" || transaction.status === "CANCEL") {
      throw new AppError(400, "Transaction cannot be extended");
    }

    // =========================================
    // PRICING
    // =========================================

    const pricing = await tx.roomPrice.findFirst({
      where: {
        id: transaction.priceId,
        dayType: "REGULAR",
      },
    });

    if (!pricing) {
      throw new AppError(400, "Please check the room pricing");
    }

    // =========================================
    // HITUNG SELISIH EXTEND
    // =========================================

    const oldExtendDuration = transaction.extendDuration;

    const newExtendDuration = extendMinute < 0 ? 0 : extendMinute;

    const difference = newExtendDuration - oldExtendDuration;

    // =========================================
    // TAMBAHAN / PENGURANGAN ROOM
    // =========================================

    const durationHour = difference / 60;

    const roomChange = Number(pricing.price) * durationHour;

    const newRoomTotal = Number(transaction.roomTotal) + roomChange;

    // =========================================
    // END TIME
    // =========================================

    const startTime = new Date(transaction.startTime);

    const currentEndTime = new Date(transaction.endTime);

    const newEndTime = new Date(
      currentEndTime.getTime() + difference * 60 * 1000,
    );

    // =========================================
    // DURASI
    // =========================================

    const newDurationMinute = transaction.durationMinute + difference;

    // =========================================
    // VALIDASI
    // =========================================

    // =========================================
    // SETTING
    // =========================================

    const setting = await tx.setting.findFirst({
      where: {
        isActive: true,
      },
    });

    const taxPercent = setting?.taxPercent ?? 10;

    const servicePercent = setting?.servicePercent ?? 5;

    // =========================================
    // BILLING
    // =========================================

    const bill = calculateBilling({
      roomTotal: newRoomTotal,

      fnbTotal: Number(transaction.fnbTotal),

      companionTotal: Number(transaction.companionTotal),

      packageTotal: Number(transaction.packageTotal),

      discPercent: Number(transaction.discPercent),

      taxPercent,
      servicePercent,
    });

    // =========================================
    // UPDATE
    // =========================================

    const updated = await tx.transaction.update({
      where: {
        id: transaction.id,
      },

      data: {
        durationMinute: transaction.durationMinute,

        extendDuration: newExtendDuration,

        startTime,

        endTime: newEndTime,

        roomTotal: bill.roomTotal,

        fnbTotal: bill.fnbTotal,

        companionTotal: bill.companionTotal,

        packageTotal: bill.packageTotal,

        subTotal: bill.subTotal,

        tax: bill.tax,

        service: bill.service,

        grandTotal: bill.grandTotal,

        disAmount: bill.disAmount,

        discPercent: bill.discPercent,
      },
    });

    return updated;
  });

  return result;
};

const stopBill = async (roomId) => {
  await prisma.$transaction(async (tx) => {
    const roomIdNumber = Number(roomId);

    // 1. Cari transaksi aktif pada room
    const transaction = await tx.transaction.findFirst({
      where: {
        roomId: roomIdNumber,
        status: {
          in: ["PENDING", "PAID"],
        },
      },
      include: {
        orders: {
          include: {
            items: {
              where: {
                type: "COMPANION",
                companionId: {
                  not: null,
                },
              },
            },
          },
        },
      },
    });

    // 2. Jika ada transaksi, bebaskan semua companion
    if (transaction) {
      const companionIds = transaction.orders
        .flatMap((order) => order.items)
        .map((item) => item.companionId)
        .filter(Boolean);

      if (companionIds.length > 0) {
        await tx.companion.updateMany({
          where: {
            id: {
              in: companionIds,
            },
          },
          data: {
            status: "AVAILABLE",
          },
        });
      }
    }

    // 3. Bebaskan room
    await tx.room.update({
      where: {
        id: roomIdNumber,
      },
      data: {
        status: "AVAILABLE",
      },
    });
  });
};

const close = async (id) => {
  const transaction = await prisma.transaction.findUnique({
    where: {
      id,
    },
  });

  if (!transaction) {
    return res.status(404).json({
      message: "Transaction not found",
    });
  }

  // Sudah close
  if (transaction.status === "CLOSE") {
    return res.json({
      message: "Transaction closed",
    });
  }

  await prisma.$transaction(async (tx) => {
    // Close transaction
    await tx.transaction.update({
      where: {
        id,
      },
      data: {
        status: "CLOSE",
      },
    });

    // Companion yang digunakan ikut available
    const orders = await tx.order.findMany({
      where: {
        transactionId: id,
      },
      include: {
        items: {
          where: {
            type: "COMPANION",
            companionId: {
              not: null,
            },
          },
        },
      },
    });

    const companionIds = orders
      .flatMap((order) => order.items)
      .map((item) => item.companionId)
      .filter(Boolean);

    if (companionIds.length > 0) {
      await tx.companion.updateMany({
        where: {
          id: {
            in: companionIds,
          },
        },
        data: {
          status: "AVAILABLE",
        },
      });
    }
  });

  return;
};

const createPayment = async (id, { type = "PARTIAL", method, amount }) => {
  const paymentAmount = Number(amount);

  if (!method) {
    throw new AppError(400, "Payment method must be filled in");
  }

  if (paymentAmount <= 0) {
    throw new AppError(400, "The payment amount must be more than 0");
  }

  const result = await prisma.$transaction(async (tx) => {
    // ============================
    // TRANSACTION
    // ============================

    const transaction = await tx.transaction.findUnique({
      where: {
        id,
      },
      include: {
        payments: {
          where: {
            status: "PAID",
          },
        },
      },
    });

    if (!transaction) {
      throw new AppError(404, "Transaction not found");
    }

    // ============================
    // HITUNG PEMBAYARAN
    // ============================

    const grandTotal = Number(transaction.grandTotal);

    const paidTotal = transaction.payments.reduce(
      (total, payment) => total + Number(payment.amount),
      0,
    );

    const remaining = grandTotal - paidTotal;

    if (remaining <= 0) {
      throw new AppError(400, "The bill is paid off");
    }

    // ============================
    // VALIDASI
    // ============================

    if (paymentAmount > remaining && method !== "CASH") {
      throw new AppError(400, "Payment exceeds the remaining bill");
    }

    if (type === "FINAL" && paymentAmount < remaining) {
      throw new AppError(400, "The final payment has to settle the bill");
    }

    // ============================
    // BUAT PAYMENT
    // ============================

    const payment = await tx.payment.create({
      data: {
        transactionId: id,
        type,
        method,
        status: "PAID",
        amount: paymentAmount,
      },
    });

    // ============================
    // HITUNG TOTAL BARU
    // ============================

    const newPaidTotal = paidTotal + paymentAmount;

    const isPaid = newPaidTotal >= grandTotal;

    // ============================
    // UPDATE TRANSACTION
    // ============================

    const updatedTransaction = await tx.transaction.update({
      where: {
        id,
      },
      data: {
        status: isPaid ? "PAID" : "PENDING",
      },
    });

    return {
      payment,
      transaction: updatedTransaction,
      grandTotal,
      paidTotal: newPaidTotal,
      remaining: Math.max(0, grandTotal - newPaidTotal),
    };
  });

  return result;
};

module.exports = { checkin, stopBill, close, createPayment, extendDuration };
