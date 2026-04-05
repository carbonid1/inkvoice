-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_PregenJob" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "voice" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "totalParagraphs" INTEGER NOT NULL,
    "completedParagraphs" INTEGER NOT NULL DEFAULT 0,
    "generatedDurationMs" INTEGER NOT NULL DEFAULT 0,
    "currentChapter" INTEGER NOT NULL DEFAULT 0,
    "currentParagraph" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "createdAt" INTEGER NOT NULL,
    "updatedAt" INTEGER NOT NULL
);
INSERT INTO "new_PregenJob" ("bookId", "completedParagraphs", "createdAt", "currentChapter", "currentParagraph", "errorMessage", "id", "status", "totalParagraphs", "updatedAt", "voice") SELECT "bookId", "completedParagraphs", "createdAt", "currentChapter", "currentParagraph", "errorMessage", "id", "status", "totalParagraphs", "updatedAt", "voice" FROM "PregenJob";
DROP TABLE "PregenJob";
ALTER TABLE "new_PregenJob" RENAME TO "PregenJob";
CREATE INDEX "PregenJob_status_idx" ON "PregenJob"("status");
CREATE INDEX "PregenJob_bookId_idx" ON "PregenJob"("bookId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
