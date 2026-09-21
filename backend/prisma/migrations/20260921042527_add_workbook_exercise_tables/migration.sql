-- CreateTable
CREATE TABLE "exercises" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "section" TEXT NOT NULL,
    "typeCode" TEXT NOT NULL,
    "instructionHanzi" TEXT,
    "instructionVi" TEXT,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercises_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "exercise_images" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "exerciseId" TEXT,
    "filePath" TEXT NOT NULL,
    "page" INTEGER,
    "cropBox" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "exercise_images_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "exercises_lessonId_idx" ON "exercises"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "exercises_lessonId_order_key" ON "exercises"("lessonId", "order");

-- CreateIndex
CREATE INDEX "exercise_images_lessonId_idx" ON "exercise_images"("lessonId");

-- CreateIndex
CREATE INDEX "exercise_images_exerciseId_idx" ON "exercise_images"("exerciseId");

-- AddForeignKey
ALTER TABLE "exercises" ADD CONSTRAINT "exercises_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_images" ADD CONSTRAINT "exercise_images_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "exercise_images" ADD CONSTRAINT "exercise_images_exerciseId_fkey" FOREIGN KEY ("exerciseId") REFERENCES "exercises"("id") ON DELETE SET NULL ON UPDATE CASCADE;
