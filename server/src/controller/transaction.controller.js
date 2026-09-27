const service = require("../service/transaction.service");

const checkin = async (req, res, next) => {
  try {
    const result = await service.checkin(req.body);

    res.status(200).json({
      message: "successfully checked in",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkin };
