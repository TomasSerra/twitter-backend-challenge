-- CreateEnum
CREATE TYPE "Visibility" AS ENUM ('PUBLIC', 'PRIVATE');

-- AlterTable
ALTER TABLE "User"
    ADD COLUMN "visibility" "Visibility" NOT NULL DEFAULT 'PUBLIC';
