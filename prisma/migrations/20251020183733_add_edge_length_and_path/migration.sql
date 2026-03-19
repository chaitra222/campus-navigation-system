/*
  Warnings:

  - You are about to drop the column `geometry` on the `edge` table. All the data in the column will be lost.
  - You are about to drop the column `weight` on the `edge` table. All the data in the column will be lost.
  - You are about to drop the `instructiontemplate` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `translation` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `lengthMeters` to the `Edge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `pathCoords` to the `Edge` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `edge` DROP COLUMN `geometry`,
    DROP COLUMN `weight`,
    ADD COLUMN `accessible` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `lengthMeters` DOUBLE NOT NULL,
    ADD COLUMN `pathCoords` JSON NOT NULL,
    MODIFY `type` ENUM('road', 'corridor', 'stairs', 'ramp', 'lift', 'footpath') NOT NULL DEFAULT 'footpath';

-- DropTable
DROP TABLE `instructiontemplate`;

-- DropTable
DROP TABLE `translation`;

-- CreateTable
CREATE TABLE `RouteHistory` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `startId` INTEGER NOT NULL,
    `endId` INTEGER NOT NULL,
    `lang` VARCHAR(191) NOT NULL DEFAULT 'en',
    `distanceMeters` DOUBLE NOT NULL,
    `durationMin` INTEGER NOT NULL,
    `pathCoords` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RouteStep` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `routeId` INTEGER NOT NULL,
    `seq` INTEGER NOT NULL,
    `kind` VARCHAR(191) NOT NULL,
    `text` VARCHAR(191) NOT NULL,
    `atLat` DOUBLE NULL,
    `atLng` DOUBLE NULL,

    INDEX `RouteStep_routeId_idx`(`routeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `RouteStep` ADD CONSTRAINT `RouteStep_routeId_fkey` FOREIGN KEY (`routeId`) REFERENCES `RouteHistory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
