const prisma = require("../lib/prisma");
const { generateLicenseKey } = require("../util/licenseKey");
const AppError = require("../lib/app.error");

async function createLicense(outletId) {
  if (!outletId) {
    throw new AppError(400, "OUTLET_ID_REQUIRED");
  }

  let key;
  let exists = true;

  while (exists) {
    key = generateLicenseKey();

    exists = await prisma.license.findUnique({
      where: {
        key,
      },
    });
  }

  const license = await prisma.license.create({
    data: {
      key,
      outletId,
      status: "UNREGISTERED",
      deviceId: null,
    },
  });

  return license;
}

async function getLicenseByKey(key) {
  if (!key) {
    throw new AppError(400, "LICENSE_KEY_REQUIRED");
  }

  return prisma.license.findUnique({
    where: {
      key,
    },
  });
}

async function activateLicense(key, deviceId) {
  if (!key) {
    throw new AppError(400, "LICENSE_KEY_REQUIRED");
  }

  if (!deviceId) {
    throw new AppError(400, "DEVICE_ID_REQUIRED");
  }

  const license = await prisma.license.findUnique({
    where: {
      key,
    },
  });

  if (!license) {
    throw new AppError(404, "LICENSE_NOT_FOUND");
  }

  if (license.status === "REVOKED") {
    throw new AppError(400, "LICENSE_REVOKED");
  }

  // License belum pernah diaktifkan
  if (license.status === "UNREGISTERED") {
    const updatedLicense = await prisma.license.update({
      where: {
        id: license.id,
      },
      data: {
        deviceId,
        status: "REGISTERED",
      },
    });

    return {
      message: "License berhasil diaktifkan",
      license: updatedLicense,
    };
  }

  // License sudah pernah diaktifkan
  if (license.status === "REGISTERED") {
    // Device sama
    if (license.deviceId === deviceId) {
      return {
        message: "Device berhasil diverifikasi",
        license,
      };
    }

    // Device berbeda
    throw new AppError(400, "DEVICE_NOT_MATCH");
  }

  throw new AppError(400, "LICENSE_INVALID");
}

async function verifyLicense(key, deviceId) {
  if (!key) {
    throw new AppError(400, "LICENSE_KEY_REQUIRED");
  }

  if (!deviceId) {
    throw new AppError(400, "DEVICE_ID_REQUIRED");
  }

  const license = await prisma.license.findUnique({
    where: {
      key,
    },
  });

  if (!license) {
    throw new AppError(404, "LICENSE_NOT_FOUND");
  }

  if (license.status === "REVOKED") {
    throw new AppError(400, "LICENSE_REVOKED");
  }

  if (license.status !== "REGISTERED") {
    throw new AppError(400, "LICENSE_NOT_REGISTERED");
  }

  if (license.deviceId !== deviceId) {
    throw new AppError(400, "DEVICE_NOT_MATCH");
  }

  return {
    license,
  };
}

async function revokeLicense(id) {
  const license = await prisma.license.findUnique({
    where: {
      id,
    },
  });

  if (!license) {
    throw new AppError(404, "LICENSE_NOT_FOUND");
  }

  return prisma.license.update({
    where: {
      id,
    },
    data: {
      status: "REVOKED",
    },
  });
}

async function unregisterLicense(id) {
  const license = await prisma.license.findUnique({
    where: {
      id,
    },
  });

  if (!license) {
    throw new AppError(404, "LICENSE_NOT_FOUND");
  }

  return prisma.license.update({
    where: {
      id,
    },
    data: {
      deviceId: null,
      status: "UNREGISTERED",
    },
  });
}

module.exports = {
  createLicense,
  getLicenseByKey,
  activateLicense,
  verifyLicense,
  revokeLicense,
  unregisterLicense,
};
