const express = require("express");
const router = express.Router();

const controller = require("../controller/transaction.controller");

router.post("/checkin", controller.checkin);
router.patch("/stop/:roomId", controller.stopBill);

module.exports = router;
