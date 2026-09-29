const service = require("../service/product.service");

const getProducts = async (req, res, next) => {
  try {
    const result = await service.getProducts(req.query.search || "");

    res.status(200).json({
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

const orderProduct = async (req, res, next) => {
  try {
    await service.orderProduct(req.body);

    res.status(200).json({
      message: "Order success",
    });
  } catch (error) {
    next(error);
  }
};
const updateOrderProduct = async (req, res, next) => {
  try {
    await service.updateOrderProduct(req.body);

    res.status(200).json({
      message: "Update order success",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProducts, orderProduct, updateOrderProduct };
