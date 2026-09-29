const express = require("express");
const router = express.Router();

const controller = require("../controller/companion.controller");

router.get("/", controller.getCompanions);
router.post("/order", controller.order);
router.post("/stop", controller.stop);

module.exports = router;
