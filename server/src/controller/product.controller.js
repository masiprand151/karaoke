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

module.exports = { getProducts };
