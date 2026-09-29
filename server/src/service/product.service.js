const { FnbCategory } = require("../generated/prisma");
const { Decimal } = require("../generated/prisma/runtime/library");
const AppError = require("../lib/app.error");
const prisma = require("../lib/prisma");
const { calculateBilling } = require("../util/billing");
const bcrypt = require("bcrypt");

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

      // kelola stock
      if (product.trackStock) {
        if (Number(product.stock) < quantity) {
          throw new AppError(400, "Stock tidak mencukupi");
        }

        const stockBefore = product.stock;

        const updatedProduct = await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stock: {
              decrement: quantity,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "OUT",
            referenceType: "ORDER",
            quantity,
            stockBefore,
            stockAfter: updatedProduct.stock,
            note: "Penjualan F&B",
          },
        });
      }
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

const updateOrderProduct = async ({ transactionId, password, items = [] }) => {
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

    // Karena endpoint ini menerima 1 item dari client
    if (items.length !== 1) {
      throw new AppError(400, "Only one product item can be updated at a time");
    }

    const item = items[0];

    if (!item.id) {
      throw new AppError(400, "Order item ID is required");
    }

    if (!item.productId) {
      throw new AppError(400, "Product ID is required");
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
      throw new AppError(400, "Transaction cannot edit product order");
    }

    // =========================================
    // GET ORDER
    // =========================================

    const order = await tx.order.findFirst({
      where: {
        transactionId,
        status: "SENT",
      },
    });

    if (!order) {
      throw new AppError(404, "Product order not found");
    }

    // =========================================
    // GET ORDER ITEM
    // =========================================

    const orderItem = await tx.orderItem.findUnique({
      where: {
        id: Number(item.id),
      },
    });

    if (!orderItem) {
      throw new AppError(404, `Order item ${item.id} not found`);
    }

    // =========================================
    // VALIDASI PRODUCT ID
    // =========================================

    const productId = Number(item.productId);

    if (orderItem.productId !== productId) {
      throw new AppError(400, "Product does not match order item");
    }

    // =========================================
    // VALIDASI QUANTITY
    // =========================================

    const newQuantity = Number(item.quantity);

    if (!Number.isInteger(newQuantity) || newQuantity < 0) {
      throw new AppError(400, `Invalid quantity for ${orderItem.name}`);
    }

    const oldQuantity = orderItem.quantity;

    // =========================================
    // TIDAK ADA PERUBAHAN
    // =========================================

    if (newQuantity === oldQuantity) {
      return {
        order: await tx.order.findUnique({
          where: {
            id: order.id,
          },
          include: {
            items: true,
          },
        }),
        transaction,
      };
    }

    // =========================================
    // QTY BERKURANG
    // PASSWORD WAJIB
    // =========================================

    if (newQuantity < oldQuantity) {
      if (typeof password !== "string" || password.trim() === "") {
        throw new AppError(400, "Password is required when reducing quantity");
      }

      // =========================================
      // GET MASTER PASSWORD
      // =========================================

      const master = await tx.masterPassword.findFirst({
        where: {
          type: "UPDATE",
        },
      });

      if (!master) {
        throw new AppError(500, "Master password is not configured");
      }

      // =========================================
      // CHECK PASSWORD
      // =========================================

      const valid = await bcrypt.compare(password, master.password);

      if (!valid) {
        throw new AppError(400, "Password wrong");
      }
    }

    // =========================================
    // GET PRODUCT
    // =========================================

    const product = await tx.product.findUnique({
      where: {
        id: orderItem.productId,
      },
    });

    if (!product) {
      throw new AppError(404, `Product ${orderItem.productId} not found`);
    }

    // =========================================
    // QTY 0 → DELETE
    // =========================================

    if (newQuantity === 0) {
      // -----------------------------------------
      // KEMBALIKAN STOCK
      // -----------------------------------------

      if (product.trackStock) {
        const stockBefore = new Decimal(product.stock);

        const returnQty = oldQuantity;

        const updatedProduct = await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stock: {
              increment: returnQty,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "IN",
            referenceType: "RETURN",
            quantity: returnQty,
            stockBefore,
            stockAfter: updatedProduct.stock,
            note: `Hapus OrderItem #${orderItem.id}`,
          },
        });
      }

      // -----------------------------------------
      // DELETE ORDER ITEM
      // -----------------------------------------

      await tx.orderItem.delete({
        where: {
          id: orderItem.id,
        },
      });
    } else {
      // =========================================
      // HITUNG SELISIH
      // =========================================

      const difference = newQuantity - oldQuantity;

      // =========================================
      // QTY BERTAMBAH
      // =========================================

      if (difference > 0 && product.trackStock) {
        const additionalQty = difference;

        const stockBefore = new Decimal(product.stock);

        // -----------------------------------------
        // CHECK STOCK
        // -----------------------------------------

        if (stockBefore.lt(additionalQty)) {
          throw new AppError(400, `Stock ${product.name} tidak mencukupi`);
        }

        // -----------------------------------------
        // KURANGI STOCK
        // -----------------------------------------

        const updatedProduct = await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stock: {
              decrement: additionalQty,
            },
          },
        });

        // -----------------------------------------
        // STOCK MOVEMENT
        // -----------------------------------------

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "OUT",
            referenceType: "ORDER",
            quantity: additionalQty,
            stockBefore,
            stockAfter: updatedProduct.stock,
            note: `Tambah qty OrderItem #${orderItem.id}`,
          },
        });
      }

      // =========================================
      // QTY BERKURANG
      // =========================================

      if (difference < 0 && product.trackStock) {
        const returnQty = Math.abs(difference);

        const stockBefore = new Decimal(product.stock);

        // -----------------------------------------
        // KEMBALIKAN STOCK
        // -----------------------------------------

        const updatedProduct = await tx.product.update({
          where: {
            id: product.id,
          },
          data: {
            stock: {
              increment: returnQty,
            },
          },
        });

        // -----------------------------------------
        // STOCK MOVEMENT
        // -----------------------------------------

        await tx.stockMovement.create({
          data: {
            productId: product.id,
            type: "IN",
            referenceType: "RETURN",
            quantity: returnQty,
            stockBefore,
            stockAfter: updatedProduct.stock,
            note: `Kurangi qty OrderItem #${orderItem.id}`,
          },
        });
      }

      // =========================================
      // UPDATE ORDER ITEM
      // =========================================

      const unitPrice = new Decimal(orderItem.unitPrice);

      const subtotal = unitPrice.mul(newQuantity);

      await tx.orderItem.update({
        where: {
          id: orderItem.id,
        },
        data: {
          quantity: newQuantity,
          subtotal,
        },
      });
    }

    // =========================================
    // HITUNG ULANG F&B
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
    // BILLING
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

    // =========================================
    // RETURN
    // =========================================

    return {
      order: await tx.order.findUnique({
        where: {
          id: order.id,
        },
        include: {
          items: true,
        },
      }),

      transaction: updatedTransaction,
    };
  });

  return result;
};

module.exports = { getProducts, orderProduct, updateOrderProduct };
