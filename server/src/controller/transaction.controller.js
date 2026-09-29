const service = require("../service/transaction.service");

const checkin = async (req, res, next) => {
  try {
    await service.checkin(req.body);

    res.status(200).json({
      message: "successfully checked in",
    });
  } catch (error) {
    next(error);
  }
};
const stopBill = async (req, res, next) => {
  try {
    await service.stopBill(req.params.roomId);

    res.status(200).json({
      message: "successfully stop billing",
    });
  } catch (error) {
    next(error);
  }
};

const close = async (req, res, next) => {
  try {
    const transactionId = req.params.id;

    await service.close(transactionId);
    res.json({
      message: "Transaction auto close",
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { checkin, stopBill, close };
