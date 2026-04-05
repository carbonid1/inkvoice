-- CreateTable
CREATE TABLE "PregenJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "totalParagraphs" INTEGER NOT NULL,
    "completedParagraphs" INTEGER NOT NULL DEFAULT 0,
    "currentChapter" INTEGER NOT NULL DEFAULT 0,
    "currentParagraph" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "PregenJob_status_idx" ON "PregenJob"("status");

-- CreateIndex
CREATE INDEX "PregenJob_bookId_idx" ON "PregenJob"("bookId");
