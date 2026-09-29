const express = require("express");
const router = express.Router();

const controller = require("../controller/product.controller");

router.get("/", controller.getProducts);
router.post("/order", controller.orderProduct);
router.patch("/order", controller.updateOrderProduct);

module.exports = router;
