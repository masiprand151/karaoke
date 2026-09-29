const express = require("express");
const router = express.Router();

const controller = require("../controller/companion.controller");

router.get("/", controller.getCompanions);
router.post("/order", controller.order);

module.exports = router;
