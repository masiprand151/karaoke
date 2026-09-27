const bcrypt = require("bcrypt");
const {
  PrismaClient,
  MasterPasswordType,
  LicenseStatus,
} = require("../src/generated/prisma");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // =====================================================
  // PASSWORD
  // =====================================================

  const adminPassword = await bcrypt.hash("admin", 10);

  const masterPassword = await bcrypt.hash("1", 10);

  // =====================================================
  // ADMIN USER
  // =====================================================

  const admin = await prisma.user.upsert({
    where: {
      username: "admin",
    },

    update: {
      password: adminPassword,
      fullAccess: true,
      deletedAt: null,
    },

    create: {
      username: "admin",
      password: adminPassword,
      fullAccess: true,
    },
  });

  console.log(`Admin created: ${admin.username}`);

  // =====================================================
  // MASTER PASSWORD
  // =====================================================

  const masterPasswords = [
    {
      type: MasterPasswordType.UPDATE,
      password: masterPassword,
    },
    {
      type: MasterPasswordType.DISCOUNT,
      password: masterPassword,
    },
    {
      type: MasterPasswordType.DELETE,
      password: masterPassword,
    },
  ];

  for (const item of masterPasswords) {
    await prisma.masterPassword.upsert({
      where: {
        type: item.type,
      },

      update: {
        password: item.password,
      },

      create: {
        type: item.type,
        password: item.password,
      },
    });
  }

  console.log("Master passwords created");

  // =====================================================
  // LICENSE
  // =====================================================

  const license = await prisma.license.upsert({
    where: {
      key: "KARAOKE-DEV-000001",
    },

    update: {
      outletId: "OUTLET-001",
      status: LicenseStatus.UNREGISTERED,
      deviceId: null,
    },

    create: {
      key: "KARAOKE-DEV-000001",
      outletId: "OUTLET-001",
      status: LicenseStatus.UNREGISTERED,
      deviceId: null,
    },
  });

  // setup room
  const rooms = [];
  const pricings = [];

  for (let index = 0; index < 20; index++) {
    const name = `R${String(index + 1).padStart(2, "0")}`;
    const type = "MEDIUM";

    rooms.push({
      name,
      type,
    });
  }

  await prisma.room.createMany({
    data: rooms,
    skipDuplicates: true,
  });

  const rms = await prisma.room.findMany();

  for (let index = 0; index < rms.length; index++) {
    const r = rms[index];
    pricings.push({
      roomId: r.id,
      dayType: "REGULAR",
      startTime: "12:00",
      endTime: "03:00",
      price: 80000,
    });

    pricings.push({
      roomId: r.id,
      dayType: "WEEKEND",
      startTime: "12:00",
      endTime: "03:00",
      price: 50000,
    });

    pricings.push({
      roomId: r.id,
      dayType: "PROMO",
      startTime: "12:00",
      endTime: "03:00",
      price: 40000,
    });
  }

  await prisma.roomPrice.createMany({
    data: pricings,
    skipDuplicates: true,
  });

  await prisma.setting.createMany({
    data: [
      {
        isActive: true,
        taxPercent: 10,
        servicePercent: 5,
      },
    ],
  });

  console.log(`License created: ${license.key}`);

  console.log("");
  console.log("=================================");
  console.log("SEED SELESAI");
  console.log("=================================");
}

main()
  .catch((error) => {
    console.error("Seed gagal:");
    console.error(error);

    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
