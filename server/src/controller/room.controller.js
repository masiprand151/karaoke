const service = require("../service/room.service");

const getMonitoring = async (req, res, next) => {
  try {
    const data = await service.getMonitoring();

    res.json({
      data,
    });
  } catch (error) {
    next(error);
  }
};

const billing = async (req, res, next) => {
  try {
    const data = await service.billing(req.params.roomId);

    res.json({
      data,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getMonitoring, billing };
