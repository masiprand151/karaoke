const { FnbCategory } = require("../generated/prisma");
const prisma = require("../lib/prisma");

const getProducts = async (search) => {
  const keyword = search.trim();

  const category = keyword.toUpperCase();

  const validCategory = Object.values(FnbCategory).includes(category)
    ? category
    : null;

  const products = await prisma.product.findMany({
    where: {
      isActive: true,

      ...(keyword && {
        OR: [
          {
            name: {
              contains: keyword,
            },
          },

          ...(validCategory
            ? [
                {
                  category: validCategory,
                },
              ]
            : []),
        ],
      }),
    },

    orderBy: {
      name: "asc",
    },
  });

  return products;
};

module.exports = { getProducts };
