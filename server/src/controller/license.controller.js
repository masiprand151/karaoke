const licenseService = require("../service/license.service");
const AppError = require("../lib/app.error");

async function create(req, res) {
  const { outletId } = req.body;

  if (!outletId) {
    throw new AppError(400, "OUTLET_ID_REQUIRED");
  }

  const license = await licenseService.createLicense(outletId);

  return res.status(201).json({
    message: "License berhasil dibuat",
    data: license,
  });
}

async function activate(req, res) {
  const key = req.headers["x-license-key"];
  const deviceId = req.headers["x-device-id"];

  const result = await licenseService.activateLicense(key, deviceId);

  return res.json(result);
}

async function verify(req, res) {
  const key = req.headers["x-license-key"];
  const deviceId = req.headers["x-device-id"];

  const result = await licenseService.verifyLicense(key, deviceId);

  return res.json(result);
}

async function revoke(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new AppError(400, "LICENSE_ID_INVALID");
  }

  const license = await licenseService.revokeLicense(id);

  return res.json({
    message: "License berhasil dicabut",
    data: license,
  });
}

async function unregister(req, res) {
  const id = Number(req.params.id);

  if (!Number.isInteger(id)) {
    throw new AppError(400, "LICENSE_ID_INVALID");
  }

  const license = await licenseService.unregisterLicense(id);

  return res.json({
    message: "License berhasil di-unregister",
    data: license,
  });
}

module.exports = {
  create,
  activate,
  verify,
  revoke,
  unregister,
};
