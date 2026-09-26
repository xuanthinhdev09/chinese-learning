-- AlterTable
ALTER TABLE "user_progress" ADD COLUMN     "dialogueCompletedAt" TIMESTAMP(3),
ADD COLUMN     "exercisesCompletedAt" TIMESTAMP(3),
ADD COLUMN     "vocabCompletedAt" TIMESTAMP(3);
