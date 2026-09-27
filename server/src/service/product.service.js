const { FnbCategory } = require("../generated/prisma");
const { Decimal } = require("../generated/prisma/runtime/library");
const AppError = require("../lib/app.error");
const prisma = require("../lib/prisma");
const { calculateBilling } = require("../util/billing");

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

const orderProduct = async ({ transactionId, items = [] }) => {
  const result = await prisma.$transaction(async (tx) => {
    // =========================================
    // VALIDASI
    // =========================================

    if (!transactionId) {
      throw new AppError(400, "Transaction ID is required");
    }

    if (!Array.isArray(items) || items.length === 0) {
      throw new AppError(400, "Product items is required");
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

    if (transaction.status !== "PENDING") {
      throw new AppError(400, "Transaction cannot receive product order");
    }

    // =========================================
    // GET / CREATE ORDER DRAFT
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
    // GET PRODUCTS
    // =========================================

    const productIds = [...new Set(items.map((item) => Number(item.id)))];

    const products = await tx.product.findMany({
      where: {
        id: {
          in: productIds,
        },
        isActive: true,
      },
    });

    // =========================================
    // VALIDATE PRODUCT
    // =========================================

    for (const productId of productIds) {
      const product = products.find((item) => item.id === productId);

      if (!product) {
        throw new AppError(404, `Product ${productId} not found`);
      }
    }

    // =========================================
    // CREATE ORDER ITEMS
    // =========================================

    for (const item of items) {
      const product = products.find(
        (product) => product.id === Number(item.id),
      );

      const quantity = Number(item.quantity);

      if (!Number.isInteger(quantity) || quantity <= 0) {
        throw new AppError(400, `Invalid quantity for ${product.name}`);
      }

      const unitPrice = new Decimal(product.price);
      const subtotal = unitPrice.mul(quantity);

      await tx.orderItem.create({
        data: {
          orderId: order.id,
          type: "PRODUCT",
          productId: product.id,
          name: product.name,
          quantity,
          unitPrice,
          subtotal,
        },
      });
    }

    // =========================================
    // HITUNG TOTAL F&B
    // =========================================

    const orderItems = await tx.orderItem.findMany({
      where: {
        order: {
          transactionId,
        },
        type: "PRODUCT",
      },
    });

    const fnbTotal = orderItems.reduce((total, item) => {
      return total.add(item.subtotal);
    }, new Decimal(0));

    // =========================================
    // GET SETTING
    // =========================================

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
      fnbTotal,
      packageTotal: transaction.packageTotal,
      companionTotal: transaction.companionTotal,
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

    await tx.order.update({
      where: {
        id: order.id,
      },
      data: {
        status: "SENT",
      },
    });

    // =========================================
    // RETURN
    // =========================================

    return {
      order,
      transaction: updatedTransaction,
    };
  });

  return result;
};

module.exports = { getProducts, orderProduct };
