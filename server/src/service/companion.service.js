const prisma = require("../lib/prisma");
const AppError = require("../lib/app.error");
const { Decimal } = require("../generated/prisma/runtime/library");
const { calculateBilling } = require("../util/billing");
const bcrypt = require("bcrypt");

const getCompanions = async (search = "") => {
  const lcs = await prisma.companion.findMany({
    where: {
      name: {
        contains: search,
      },
    },
  });

  return lcs;
};

const order = async ({ ladyId, transactionId, duration }) => {
  const result = await prisma.$transaction(async (tx) => {
    // =========================================
    // VALIDASI DURASI
    // =========================================

    const durationMinute = Number(duration) * 60;

    if (!Number.isInteger(durationMinute) || durationMinute <= 0) {
      throw new AppError(400, "Invalid duration");
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
      throw new AppError(400, `Transaction ${transaction.status}`);
    }

    // =========================================
    // GET COMPANION
    // =========================================

    const lady = await tx.companion.findFirst({
      where: {
        id: Number(ladyId),
        status: "AVAILABLE",
        isActive: true,
      },
    });

    if (!lady) {
      throw new AppError(404, "Companion not found");
    }

    // =========================================
    // CEK ORDER DRAFT
    // =========================================

    let order = await tx.order.findFirst({
      where: {
        transactionId,
        status: "DRAFT",
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    if (!order) {
      order = await tx.order.create({
        data: {
          transactionId,
          status: "DRAFT",
        },
      });
    }

    // =========================================
    // WAKTU COMPANION
    // =========================================

    const startTime = new Date();

    const endTime = new Date(startTime.getTime() + durationMinute * 60 * 1000);

    // =========================================
    // HITUNG HARGA
    // =========================================

    const pricePerHour = new Decimal(lady.price);

    const subtotal = pricePerHour.mul(durationMinute).div(60);

    // =========================================
    // CREATE ORDER ITEM
    // =========================================

    const orderItem = await tx.orderItem.create({
      data: {
        orderId: order.id,

        type: "COMPANION",

        companionId: lady.id,

        name: lady.name,

        quantity: duration,

        startTime,
        endTime,

        unitPrice: pricePerHour,

        subtotal,
      },
    });

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "SENT",
      },
    });

    // =========================================
    // SET COMPANION BUSY
    // =========================================

    await tx.companion.update({
      where: {
        id: lady.id,
      },
      data: {
        status: "BUSY",
      },
    });

    // =========================================
    // HITUNG TOTAL lady
    // =========================================

    const orderItems = await tx.orderItem.findMany({
      where: {
        order: {
          transactionId,
        },
        type: "COMPANION",
      },
    });

    const companionTotal = orderItems.reduce((total, item) => {
      return total.add(item.subtotal);
    }, new Decimal(0));

    const setting = await tx.setting.findFirst({
      where: {
        isActive: true,
      },
    });

    const taxPercent = setting?.taxPercent ?? 10;
    const servicePercent = setting?.servicePercent ?? 5;

    // =========================================
    // BILLING ENGINE
    // =========================================

    const billing = calculateBilling({
      roomTotal: transaction.roomTotal,
      fnbTotal: transaction.fnbTotal,
      packageTotal: transaction.packageTotal,
      companionTotal: companionTotal,
      discPercent: transaction.discPercent,
      taxPercent,
      servicePercent,
    });

    // =========================================
    // UPDATE TRANSACTION
    // =========================================

    const updatedTransaction = await tx.transaction.update({
      where: {
        id: transactionId,
      },
      data: {
        roomTotal: billing.roomTotal,
        fnbTotal: billing.fnbTotal,
        packageTotal: billing.packageTotal,
        companionTotal: billing.companionTotal,

        discPercent: billing.discPercent,
        disAmount: billing.disAmount,

        subTotal: billing.subTotal,
        tax: billing.tax,
        service: billing.service,
        grandTotal: billing.grandTotal,
      },
    });

    return {
      order,
      orderItem,
      updatedTransaction,
    };
  });

  return result;
};

const stop = async ({ id, auto = false, password }) => {
  if (auto) {
    await prisma.companion.update({
      where: {
        id: Number(id),
      },
      data: {
        status: "AVAILABLE",
      },
    });

    return;
  }

  if (!password) {
    throw new AppError(400, "Password wrong");
  }

  const masterPw = await prisma.masterPassword.findFirst({
    where: {
      type: "UPDATE",
    },
  });

  const valid = await bcrypt.compare(password, masterPw.password);
  if (!valid) {
    throw new AppError(400, "Password wrong");
  }
  await prisma.companion.update({
    where: {
      id: Number(id),
    },
    data: {
      status: "AVAILABLE",
    },
  });

  return;
};

module.exports = { getCompanions, order, stop };
