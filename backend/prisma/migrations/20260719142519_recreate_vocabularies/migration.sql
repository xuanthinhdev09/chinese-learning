-- CreateTable
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

-- CreateIndex
CREATE INDEX "vocabularies_lessonId_idx" ON "vocabularies"("lessonId");

-- CreateIndex
CREATE INDEX "vocabularies_hskLevel_idx" ON "vocabularies"("hskLevel");

-- CreateIndex
CREATE INDEX "vocabularies_hskCode_idx" ON "vocabularies"("hskCode");

-- AddForeignKey
ALTER TABLE "vocabularies" ADD CONSTRAINT "vocabularies_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;
