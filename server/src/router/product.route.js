const express = require("express");
const router = express.Router();

const controller = require("../controller/product.controller");

router.get("/", controller.getProducts);
router.post("/order", controller.orderProduct);

module.exports = router;
