-- CreateTable
CREATE TABLE "conversations" (
    "id" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "hanzi" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "vietnamese" TEXT NOT NULL,
    "audioUrl" TEXT,
    "difficulty" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversations_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "conversations_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "conversation_vocabularies" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "vocabularyId" TEXT NOT NULL,
    "position" INTEGER,

    CONSTRAINT "conversation_vocabularies_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "conversation_vocabularies_conversationId_vocabularyId_key" UNIQUE ("conversationId", "vocabularyId"),
    CONSTRAINT "conversation_vocabularies_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "conversation_vocabularies_vocabularyId_fkey" FOREIGN KEY ("vocabularyId") REFERENCES "vocabularies"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "conversations_lessonId_idx" ON "conversations"("lessonId");

-- CreateIndex
CREATE INDEX "conversations_lessonId_order_idx" ON "conversations"("lessonId", "order");

-- CreateIndex
CREATE INDEX "conversation_vocabularies_conversationId_idx" ON "conversation_vocabularies"("conversationId");

-- CreateIndex
CREATE INDEX "conversation_vocabularies_vocabularyId_idx" ON "conversation_vocabularies"("vocabularyId");
