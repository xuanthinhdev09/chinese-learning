-- Generalize HskLevel into multi-source Course (table name kept as hsk_levels)
ALTER TABLE "hsk_levels" ADD COLUMN "type" TEXT NOT NULL DEFAULT 'HSK';
DROP INDEX "hsk_levels_level_key";
CREATE INDEX "hsk_levels_type_level_idx" ON "hsk_levels"("type", "level");

-- Rename lessons FK column in place so existing rows keep their course link
ALTER TABLE "lessons" RENAME COLUMN "hskLevelId" TO "courseId";
ALTER TABLE "lessons" RENAME CONSTRAINT "lessons_hskLevelId_fkey" TO "lessons_courseId_fkey";

-- Keyword flag for lesson vocabulary
ALTER TABLE "vocabularies" ADD COLUMN "isKeyword" BOOLEAN NOT NULL DEFAULT false;

-- Dialogue line speaker (e.g. 妈妈/明明)
ALTER TABLE "conversations" ADD COLUMN "speaker" TEXT;

-- Dialogue spaced repetition: stage 0→+1d, 1→+3d, 2→+7d, 3→+14d, 4 = graduated
CREATE TABLE "user_dialogue_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "stage" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_dialogue_progress_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "user_dialogue_progress_userId_lessonId_key" ON "user_dialogue_progress"("userId", "lessonId");
CREATE INDEX "user_dialogue_progress_userId_nextReviewAt_idx" ON "user_dialogue_progress"("userId", "nextReviewAt");

ALTER TABLE "user_dialogue_progress" ADD CONSTRAINT "user_dialogue_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "user_dialogue_progress" ADD CONSTRAINT "user_dialogue_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
