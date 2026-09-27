const express = require("express");
const router = express.Router();

const licenseController = require("../controller/license.controller");

// Create license
router.post("/", licenseController.create);

// Activate license
router.post("/activate", licenseController.activate);

// Verify license
router.post("/verify", licenseController.verify);

// Revoke license
router.patch("/:id/revoke", licenseController.revoke);

// Unregister license
router.patch("/:id/unregister", licenseController.unregister);

module.exports = router;
