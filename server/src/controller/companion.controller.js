const service = require("../service/compaanion.sevice");

const getCompanions = async (req, res, next) => {
  try {
    const result = await service.getCompanions(req.query.search || "");

    res.status(200).json({ data: result });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCompanions };
