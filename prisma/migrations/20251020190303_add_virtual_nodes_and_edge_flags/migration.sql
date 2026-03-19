/*
  Warnings:

  - You are about to drop the `routehistory` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `routestep` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `routestep` DROP FOREIGN KEY `RouteStep_routeId_fkey`;

-- AlterTable
ALTER TABLE `edge` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `isDensified` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE `node` ADD COLUMN `isVirtual` BOOLEAN NOT NULL DEFAULT false;

-- DropTable
DROP TABLE `routehistory`;

-- DropTable
DROP TABLE `routestep`;
