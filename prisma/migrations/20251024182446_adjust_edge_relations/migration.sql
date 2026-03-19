/*
  Warnings:

  - You are about to drop the column `createdAt` on the `edge` table. All the data in the column will be lost.
  - You are about to drop the column `isActive` on the `edge` table. All the data in the column will be lost.
  - You are about to drop the column `isDensified` on the `edge` table. All the data in the column will be lost.
  - You are about to drop the column `isIndoor` on the `edge` table. All the data in the column will be lost.
  - You are about to alter the column `type` on the `edge` table. The data in that column could be lost. The data in that column will be cast from `Enum(EnumId(0))` to `VarChar(191)`.
  - You are about to drop the column `building` on the `node` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `node` table. All the data in the column will be lost.
  - You are about to drop the column `floor` on the `node` table. All the data in the column will be lost.
  - You are about to drop the column `isVirtual` on the `node` table. All the data in the column will be lost.
  - You are about to drop the column `updatedAt` on the `node` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `edge` DROP COLUMN `createdAt`,
    DROP COLUMN `isActive`,
    DROP COLUMN `isDensified`,
    DROP COLUMN `isIndoor`,
    MODIFY `type` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `node` DROP COLUMN `building`,
    DROP COLUMN `createdAt`,
    DROP COLUMN `floor`,
    DROP COLUMN `isVirtual`,
    DROP COLUMN `updatedAt`;
