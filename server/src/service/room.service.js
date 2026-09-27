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

  return rooms;
};

const billing = async (roomId) => {
  const room = await prisma.room.findUnique({
    where: {
      id: Number(roomId),
    },
    include: {
      transactions: {
        include: {
          roomPrice: true,
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
