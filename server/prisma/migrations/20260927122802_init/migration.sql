-- CreateTable
CREATE TABLE `License` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `key` VARCHAR(191) NOT NULL,
    `deviceId` VARCHAR(191) NULL,
    `outletId` VARCHAR(191) NOT NULL,
    `status` ENUM('REGISTERED', 'UNREGISTERED', 'REVOKED') NOT NULL DEFAULT 'UNREGISTERED',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `License_key_key`(`key`),
    UNIQUE INDEX `License_deviceId_key`(`deviceId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `username` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `fullAccess` BOOLEAN NOT NULL DEFAULT false,
    `deletedAt` DATETIME(3) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_username_key`(`username`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MasterPassword` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `type` ENUM('UPDATE', 'DISCOUNT', 'DELETE', 'ALL') NOT NULL DEFAULT 'ALL',
    `password` VARCHAR(191) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `MasterPassword_type_key`(`type`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Room` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `type` VARCHAR(191) NOT NULL,
    `status` ENUM('AVAILABLE', 'OCCUPIED', 'MAINTENANCE') NOT NULL DEFAULT 'AVAILABLE',

    UNIQUE INDEX `Room_name_key`(`name`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RoomPrice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `roomId` INTEGER NOT NULL,
    `dayType` ENUM('REGULAR', 'PROMO', 'WEEKEND', 'PACKAGE') NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `price` DECIMAL(12, 2) NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `RoomPrice_roomId_idx`(`roomId`),
    INDEX `RoomPrice_roomId_dayType_idx`(`roomId`, `dayType`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Setting` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `taxPercent` INTEGER NOT NULL DEFAULT 10,
    `servicePercent` INTEGER NOT NULL DEFAULT 5,

    UNIQUE INDEX `Setting_isActive_key`(`isActive`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Transaction` (
    `id` VARCHAR(191) NOT NULL,
    `roomId` INTEGER NOT NULL,
    `priceId` INTEGER NOT NULL,
    `customerName` VARCHAR(191) NOT NULL,
    `customerPhone` VARCHAR(191) NULL,
    `people` INTEGER NOT NULL DEFAULT 1,
    `durationMinute` INTEGER NOT NULL,
    `extendDuration` INTEGER NOT NULL DEFAULT 0,
    `freeDuration` INTEGER NOT NULL DEFAULT 0,
    `startTime` DATETIME(3) NOT NULL,
    `endTime` DATETIME(3) NOT NULL,
    `cashier` VARCHAR(191) NOT NULL,
    `status` ENUM('PENDING', 'PAID', 'CLOSE', 'CANCEL') NOT NULL DEFAULT 'PENDING',
    `roomTotal` DECIMAL(12, 2) NOT NULL,
    `fnbTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `companionTotal` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `subTotal` DECIMAL(12, 2) NOT NULL,
    `tax` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `service` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `grandTotal` DECIMAL(12, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Transaction_roomId_idx`(`roomId`),
    INDEX `Transaction_priceId_idx`(`priceId`),
    INDEX `Transaction_status_idx`(`status`),
    INDEX `Transaction_startTime_idx`(`startTime`),
    INDEX `Transaction_endTime_idx`(`endTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `InvoiceCounter` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `date` DATE NOT NULL,
    `lastNumber` INTEGER NOT NULL DEFAULT 0,

    UNIQUE INDEX `InvoiceCounter_date_key`(`date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RoomPrice` ADD CONSTRAINT `RoomPrice_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_roomId_fkey` FOREIGN KEY (`roomId`) REFERENCES `Room`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Transaction` ADD CONSTRAINT `Transaction_priceId_fkey` FOREIGN KEY (`priceId`) REFERENCES `RoomPrice`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
