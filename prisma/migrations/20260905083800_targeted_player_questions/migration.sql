-- CreateEnum
CREATE TYPE "QuestionScope" AS ENUM ('ALL', 'TEAM', 'CUSTOM_GROUP');

-- AlterTable
ALTER TABLE "SetupQuestion" ADD COLUMN     "scope" "QuestionScope" NOT NULL DEFAULT 'ALL',
ADD COLUMN     "teamId" INTEGER;

-- CreateTable
CREATE TABLE "QuestionEligiblePlayer" (
    "questionId" INTEGER NOT NULL,
    "playerId" INTEGER NOT NULL,

    CONSTRAINT "QuestionEligiblePlayer_pkey" PRIMARY KEY ("questionId","playerId")
);

-- AddForeignKey
ALTER TABLE "QuestionEligiblePlayer" ADD CONSTRAINT "QuestionEligiblePlayer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "SetupQuestion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionEligiblePlayer" ADD CONSTRAINT "QuestionEligiblePlayer_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE CASCADE ON UPDATE CASCADE;
