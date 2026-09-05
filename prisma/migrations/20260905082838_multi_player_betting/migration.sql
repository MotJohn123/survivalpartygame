-- DropForeignKey
ALTER TABLE "Bet" DROP CONSTRAINT "Bet_candidateId_fkey";

-- DropForeignKey
ALTER TABLE "BettingRound" DROP CONSTRAINT "BettingRound_teamAId_fkey";

-- DropForeignKey
ALTER TABLE "BettingRound" DROP CONSTRAINT "BettingRound_teamBId_fkey";

-- AlterTable
ALTER TABLE "Bet" ADD COLUMN     "stake" INTEGER NOT NULL DEFAULT 0,
ALTER COLUMN "candidateId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "BettingRound" ADD COLUMN     "maxBet" INTEGER NOT NULL DEFAULT 100,
ADD COLUMN     "maxPlayers" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "multiplier" INTEGER NOT NULL DEFAULT 2,
ALTER COLUMN "teamAId" DROP NOT NULL,
ALTER COLUMN "teamBId" DROP NOT NULL,
ALTER COLUMN "rewardPoints" SET DEFAULT 0;

-- CreateTable
CREATE TABLE "BetSelection" (
    "betId" INTEGER NOT NULL,
    "candidateId" INTEGER NOT NULL,

    CONSTRAINT "BetSelection_pkey" PRIMARY KEY ("betId","candidateId")
);

-- AddForeignKey
ALTER TABLE "BettingRound" ADD CONSTRAINT "BettingRound_teamAId_fkey" FOREIGN KEY ("teamAId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BettingRound" ADD CONSTRAINT "BettingRound_teamBId_fkey" FOREIGN KEY ("teamBId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Bet" ADD CONSTRAINT "Bet_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_betId_fkey" FOREIGN KEY ("betId") REFERENCES "Bet"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BetSelection" ADD CONSTRAINT "BetSelection_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Player"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
