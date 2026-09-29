const prisma = require("../lib/prisma");

const getMonitoring = async () => {
  const rooms = await prisma.room.findMany({
    include: {
      roomPrices: true,

      transactions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },

    orderBy: {
      id: "asc",
    },
  });

  return rooms.map((r) => ({
    ...r,
    transactions: r.status !== "AVAILABLE" ? r.transactions : [],
  }));
};

const billing = async (roomId) => {
  const room = await prisma.room.findUnique({
    where: {
      id: Number(roomId),
    },
    include: {
      transactions: {
        include: {
          payments: true,
          roomPrice: true,
          orders: {
            include: {
              items: {
                include: {
                  product: true,
                  companion: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
      },
    },
  });

  return {
    ...room,
    transactions: room.transactions?.[0] || [],
  };
};

module.exports = { getMonitoring, billing };
