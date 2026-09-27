const express = require("express");
const router = express.Router();

const controller = require("../controller/transaction.controller");

router.post("/checkin", controller.checkin);

module.exports = router;
