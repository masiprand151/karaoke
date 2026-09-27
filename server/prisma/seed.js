const bcrypt = require("bcrypt");
const {
  PrismaClient,
  MasterPasswordType,
  LicenseStatus,
  FnbCategory,
  CompanionStatus,
  PackageItemType,
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

  // const rms = await prisma.room.findMany();

  // for (let index = 0; index < rms.length; index++) {
  //   const r = rms[index];
  //   pricings.push({
  //     roomId: r.id,
  //     dayType: "REGULAR",
  //     startTime: "12:00",
  //     endTime: "03:00",
  //     price: 80000,
  //   });

  //   pricings.push({
  //     roomId: r.id,
  //     dayType: "WEEKEND",
  //     startTime: "12:00",
  //     endTime: "03:00",
  //     price: 50000,
  //   });

  //   pricings.push({
  //     roomId: r.id,
  //     dayType: "PROMO",
  //     startTime: "12:00",
  //     endTime: "03:00",
  //     price: 40000,
  //   });
  // }

  // await prisma.roomPrice.createMany({
  //   data: pricings,
  //   skipDuplicates: true,
  // });

  // await prisma.setting.createMany({
  //   data: [
  //     {
  //       isActive: true,
  //       taxPercent: 10,
  //       servicePercent: 5,
  //     },
  //   ],
  // });

  const products = [
    {
      name: "Air Mineral",
      category: FnbCategory.DRINK,
      price: 5000,
      stock: 100,
    },
    {
      name: "Coca Cola",
      category: FnbCategory.DRINK,
      price: 10000,
      stock: 100,
    },
    {
      name: "Fanta",
      category: FnbCategory.DRINK,
      price: 10000,
      stock: 100,
    },
    {
      name: "Sprite",
      category: FnbCategory.DRINK,
      price: 10000,
      stock: 100,
    },
    {
      name: "Kopi",
      category: FnbCategory.DRINK,
      price: 12000,
      stock: 50,
    },
    {
      name: "Kentang Goreng",
      category: FnbCategory.SNACK,
      price: 15000,
      stock: 50,
    },
    {
      name: "Nugget",
      category: FnbCategory.SNACK,
      price: 18000,
      stock: 50,
    },
    {
      name: "Mie Goreng",
      category: FnbCategory.FOOD,
      price: 18000,
      stock: 50,
    },
    {
      name: "Nasi Goreng",
      category: FnbCategory.FOOD,
      price: 25000,
      stock: 50,
    },
    {
      name: "Mix Snack",
      category: FnbCategory.SNACK,
      price: 20000,
      stock: 50,
    },
  ];

  const productMap = {};

  for (const item of products) {
    const product = await prisma.product.upsert({
      where: {
        name: item.name,
      },
      update: {
        category: item.category,
        price: item.price,
        stock: item.stock,
        isActive: true,
      },
      create: {
        name: item.name,
        category: item.category,
        price: item.price,
        stock: item.stock,
        isActive: true,
      },
    });

    productMap[item.name] = product;
  }

  console.log(`✅ ${products.length} Product berhasil`);

  // ======================================================
  // COMPANION
  // ======================================================

  const companions = [
    {
      name: "Sinta",
      code: "LC001",
      price: 120000,
    },
    {
      name: "Ayu",
      code: "LC002",
      price: 120000,
    },
    {
      name: "Nadia",
      code: "LC003",
      price: 120000,
    },
    {
      name: "Vina",
      code: "LC004",
      price: 120000,
    },
    {
      name: "Rani",
      code: "LC005",
      price: 120000,
    },
  ];

  const companionMap = {};

  for (const item of companions) {
    const companion = await prisma.companion.upsert({
      where: {
        code: item.code,
      },
      update: {
        name: item.name,
        price: item.price,
        status: CompanionStatus.AVAILABLE,
        isActive: true,
      },
      create: {
        name: item.name,
        code: item.code,
        price: item.price,
        status: CompanionStatus.AVAILABLE,
        isActive: true,
      },
    });

    companionMap[item.code] = companion;
  }

  console.log(`✅ ${companions.length} Companion berhasil`);

  // ======================================================
  // PACKAGE 1
  // ======================================================

  const package1 = await prisma.package.upsert({
    where: {
      id: 1,
    },
    update: {
      name: "Paket Regular",
      description: "Paket karaoke regular",
      price: 150000,
      durationMinute: 120,
      isActive: true,
    },
    create: {
      name: "Paket Regular",
      description: "Paket karaoke regular",
      price: 150000,
      durationMinute: 120,
      isActive: true,
    },
  });

  // Hapus item lama supaya seed tidak menggandakan
  await prisma.packageItem.deleteMany({
    where: {
      packageId: package1.id,
    },
  });

  await prisma.packageItem.createMany({
    data: [
      {
        packageId: package1.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Coca Cola"].id,
        quantity: 2,
      },
      {
        packageId: package1.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Kentang Goreng"].id,
        quantity: 1,
      },
      {
        packageId: package1.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Air Mineral"].id,
        quantity: 2,
      },
    ],
  });

  // ======================================================
  // PACKAGE 2
  // ======================================================

  const package2 = await prisma.package.upsert({
    where: {
      id: 2,
    },
    update: {
      name: "Paket VIP",
      description: "Paket VIP dengan makanan dan minuman",
      price: 250000,
      durationMinute: 120,
      isActive: true,
    },
    create: {
      name: "Paket VIP",
      description: "Paket VIP dengan makanan dan minuman",
      price: 250000,
      durationMinute: 120,
      isActive: true,
    },
  });

  await prisma.packageItem.deleteMany({
    where: {
      packageId: package2.id,
    },
  });

  await prisma.packageItem.createMany({
    data: [
      {
        packageId: package2.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Coca Cola"].id,
        quantity: 4,
      },
      {
        packageId: package2.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Kentang Goreng"].id,
        quantity: 2,
      },
      {
        packageId: package2.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Nugget"].id,
        quantity: 1,
      },
      {
        packageId: package2.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Mix Snack"].id,
        quantity: 1,
      },

      // Companion optional
      {
        packageId: package2.id,
        type: PackageItemType.COMPANION,
        companionId: null,
        quantity: 1,
      },
    ],
  });

  // ======================================================
  // PACKAGE 3
  // ======================================================

  const package3 = await prisma.package.upsert({
    where: {
      id: 3,
    },
    update: {
      name: "Paket Party",
      description: "Paket party karaoke",
      price: 350000,
      durationMinute: 180,
      isActive: true,
    },
    create: {
      name: "Paket Party",
      description: "Paket party karaoke",
      price: 350000,
      durationMinute: 180,
      isActive: true,
    },
  });

  await prisma.packageItem.deleteMany({
    where: {
      packageId: package3.id,
    },
  });

  await prisma.packageItem.createMany({
    data: [
      {
        packageId: package3.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Coca Cola"].id,
        quantity: 6,
      },
      {
        packageId: package3.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Air Mineral"].id,
        quantity: 6,
      },
      {
        packageId: package3.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Kentang Goreng"].id,
        quantity: 3,
      },
      {
        packageId: package3.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Nugget"].id,
        quantity: 2,
      },
      {
        packageId: package3.id,
        type: PackageItemType.PRODUCT,
        productId: productMap["Nasi Goreng"].id,
        quantity: 2,
      },

      // Companion optional
      {
        packageId: package3.id,
        type: PackageItemType.COMPANION,
        companionId: null,
        quantity: 1,
      },
    ],
  });

  console.log("✅ 3 Package berhasil");

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
