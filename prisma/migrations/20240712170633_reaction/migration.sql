-- CreateEnum
CREATE TYPE "ReactionAction" AS ENUM ('LIKE', 'RETWEET');

-- CreateTable
CREATE TABLE "Reaction"
(
    "id"        UUID             NOT NULL DEFAULT gen_random_uuid(),
    "authorId"  UUID             NOT NULL,
    "postId"    UUID             NOT NULL,
    "action"    "ReactionAction" NOT NULL,
    "createdAt" TIMESTAMP(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3)     NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Reaction"
    ADD CONSTRAINT "Reaction_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reaction"
    ADD CONSTRAINT "Reaction_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post" ("id") ON DELETE CASCADE ON UPDATE CASCADE;
