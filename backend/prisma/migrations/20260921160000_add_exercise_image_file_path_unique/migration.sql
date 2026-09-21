-- ExerciseImage files are addressed by lesson + relative path; the importer
-- upserts by that pair, so it must be unique.
CREATE UNIQUE INDEX "exercise_images_lessonId_filePath_key" ON "exercise_images"("lessonId", "filePath");
