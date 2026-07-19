-- Recreate missing tables (lessons, vocabularies, user_progress, user_vocabulary_progress)

-- CreateTable: lessons
CREATE TABLE "lessons" (
    "id" TEXT NOT NULL,
    "hskLevelId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("id")
);

-- CreateTable: vocabularies
CREATE TABLE "vocabularies" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "hanzi" TEXT NOT NULL,
    "traditional" TEXT,
    "pinyin" TEXT NOT NULL,
    "meaning" TEXT NOT NULL,
    "audioUrl" TEXT,
    "example" TEXT,
    "wordType" TEXT,
    "pos" TEXT,
    "hskCode" TEXT,
    "hskLevel" INTEGER,
    "variants" TEXT,
    "cedict" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "vocabularies_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_progress
CREATE TABLE "user_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "isCompleted" BOOLEAN NOT NULL DEFAULT false,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable: user_vocabulary_progress
CREATE TABLE "user_vocabulary_progress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "masteryLevel" INTEGER NOT NULL DEFAULT 0,
    "reviewCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER NOT NULL DEFAULT 0,
    "lastReviewedAt" TIMESTAMP(3),
    "nextReviewAt" TIMESTAMP(3),
    "isMastered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_vocabulary_progress_pkey" PRIMARY KEY ("id")
);

-- CreateIndex: lessons
CREATE INDEX "lessons_hskLevelId_idx" ON "lessons"("hskLevelId");

-- CreateIndex: vocabularies
CREATE INDEX "vocabularies_lessonId_idx" ON "vocabularies"("lessonId");
CREATE INDEX "vocabularies_hskLevel_idx" ON "vocabularies"("hskLevel");
CREATE INDEX "vocabularies_hskCode_idx" ON "vocabularies"("hskCode");

-- CreateIndex: user_progress
CREATE UNIQUE INDEX "user_progress_userId_lessonId_key" ON "user_progress"("userId", "lessonId");

-- CreateIndex: user_vocabulary_progress
CREATE UNIQUE INDEX "user_vocabulary_progress_userId_vocabularyId_key" ON "user_vocabulary_progress"("userId", "vocabularyId");
CREATE INDEX "user_vocabulary_progress_userId_nextReviewAt_idx" ON "user_vocabulary_progress"("userId", "nextReviewAt");
CREATE INDEX "user_vocabulary_progress_userId_isMastered_idx" ON "user_vocabulary_progress"("userId", "isMastered");

-- AddForeignKey: lessons -> hsk_levels
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_hskLevelId_fkey" FOREIGN KEY ("hskLevelId") REFERENCES "hsk_levels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: vocabularies -> lessons
ALTER TABLE "vocabularies" ADD CONSTRAINT "vocabularies_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: user_progress -> users
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: user_progress -> lessons
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: user_vocabulary_progress -> users
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey: user_vocabulary_progress -> vocabularies
ALTER TABLE "user_vocabulary_progress" ADD CONSTRAINT "user_vocabulary_progress_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE;
