const service = require("../service/companion.service");

const getCompanions = async (req, res, next) => {
  try {
    const result = await service.getCompanions(req.query.search || "");

    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

const order = async (req, res, next) => {
  try {
    const result = await service.order(req.body);
    res.status(200).json({
      message: "Successfuly order companion",
    });
  } catch (error) {
    next(error);
  }
};

const stop = async (req, res, next) => {
  await service.stop(req.body);

  res.status(200).json({
    message: "Successfuly stop companion",
  });
};

module.exports = { getCompanions, order, stop };
