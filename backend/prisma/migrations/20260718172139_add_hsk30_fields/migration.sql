-- AlterTable
ALTER TABLE "vocabularies" ADD COLUMN     "cedict" TEXT,
ADD COLUMN     "hskCode" TEXT,
ADD COLUMN     "hskLevel" INTEGER,
ADD COLUMN     "pos" TEXT,
ADD COLUMN     "traditional" TEXT,
ADD COLUMN     "variants" TEXT;

-- CreateIndex
CREATE INDEX "vocabularies_lessonId_idx" ON "vocabularies"("lessonId");

-- CreateIndex
CREATE INDEX "vocabularies_hskLevel_idx" ON "vocabularies"("hskLevel");

-- CreateIndex
CREATE INDEX "vocabularies_hskCode_idx" ON "vocabularies"("hskCode");
