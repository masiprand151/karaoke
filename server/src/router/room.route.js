const express = require("express");
const router = express.Router();

const controller = require("../controller/room.controller");

router.get("/", controller.getMonitoring);
router.get("/billing/:roomId", controller.billing);

module.exports = router;
