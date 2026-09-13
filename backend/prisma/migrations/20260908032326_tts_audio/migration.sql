-- CreateTable
CREATE TABLE "tts_audio" (
    "id" TEXT NOT NULL,
    "cacheKey" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'zh-CN',
    "speed" DOUBLE PRECISION NOT NULL DEFAULT 1.0,
    "pauseMs" INTEGER,
    "outputFormat" TEXT NOT NULL DEFAULT 'audio-24khz-48kbitrate-mono-mp3',
    "filePath" TEXT NOT NULL,
    "charCount" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tts_audio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tts_audio_cacheKey_key" ON "tts_audio"("cacheKey");
