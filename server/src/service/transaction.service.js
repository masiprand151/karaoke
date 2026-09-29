const prisma = require("../lib/prisma");
const AppError = require("../lib/app.error");
const { generateInvoiceNumber } = require("../util/invoice");

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

module.exports = { checkin, stopBill, close };
