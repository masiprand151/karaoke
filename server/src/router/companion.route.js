const express = require("express");
const router = express.Router();

const controller = require("../controller/companion.controller");

router.get("/", controller.getCompanions);

module.exports = router;
