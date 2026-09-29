const express = require("express");
const router = express.Router();

const controller = require("../controller/transaction.controller");

router.post("/checkin", controller.checkin);
router.patch("/stop/:roomId", controller.stopBill);
router.post("/:id/close", controller.close);
router.post("/:id/payment", controller.createPayment);

module.exports = router;
