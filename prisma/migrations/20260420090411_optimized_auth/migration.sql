/*
  Warnings:

  - You are about to drop the column `userId` on the `VerificationToken` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[token]` on the table `PasswordResetToken` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[refreshToken]` on the table `Session` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[token]` on the table `VerificationToken` will be added. If there are existing duplicate values, this will fail.
  - Made the column `userAgent` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Made the column `ipAddress` on table `Session` required. This step will fail if there are existing NULL values in that column.
  - Added the required column `email` to the `VerificationToken` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "VerificationToken" DROP CONSTRAINT "VerificationToken_userId_fkey";

-- DropIndex
DROP INDEX "PasswordResetToken_userId_idx";

-- DropIndex
DROP INDEX "Session_userId_idx";

-- DropIndex
DROP INDEX "VerificationToken_userId_idx";

-- AlterTable
ALTER TABLE "Session" ALTER COLUMN "userAgent" SET NOT NULL,
ALTER COLUMN "ipAddress" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "lockedUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "VerificationToken" DROP COLUMN "userId",
ADD COLUMN     "email" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "PasswordResetToken_token_key" ON "PasswordResetToken"("token");

-- CreateIndex
CREATE UNIQUE INDEX "Session_refreshToken_key" ON "Session"("refreshToken");

-- CreateIndex
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
