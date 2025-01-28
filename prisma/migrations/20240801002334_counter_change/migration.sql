/*
  Warnings:

  - You are about to drop the column `qtyComments` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `qtyLikes` on the `Post` table. All the data in the column will be lost.
  - You are about to drop the column `qtyRetweets` on the `Post` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Post" DROP COLUMN "qtyComments",
DROP COLUMN "qtyLikes",
DROP COLUMN "qtyRetweets";
