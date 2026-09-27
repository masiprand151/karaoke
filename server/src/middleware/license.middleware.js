const licenseService = require("../service/license.service");
const AppError = require("../lib/app.error");

async function verifyLicense(req, res, next) {
  const { key, deviceId } = req.headers;

  if (!key) {
    throw new AppError(401, "LICENSE_KEY_REQUIRED");
  }

  if (!deviceId) {
    throw new AppError(401, "DEVICE_ID_REQUIRED");
  }

  const result = await licenseService.verifyLicense(key, deviceId);

  req.license = result.license;

  next();
}

module.exports = {
  verifyLicense,
};
