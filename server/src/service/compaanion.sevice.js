const prisma = require("../lib/prisma");

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

module.exports = { getCompanions };
