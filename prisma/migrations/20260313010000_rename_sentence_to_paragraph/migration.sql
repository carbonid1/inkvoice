-- Rename sentence → paragraph in ReadingProgress, remove totalChapters
-- Rename sentence → paragraph in Bookmark
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- ReadingProgress: rename sentence→paragraph, sentencesPerChapter→paragraphsPerChapter, drop totalChapters
CREATE TABLE "new_ReadingProgress" (
    "bookId" TEXT NOT NULL PRIMARY KEY,
    "chapter" INTEGER NOT NULL DEFAULT 0,
    "paragraph" INTEGER NOT NULL DEFAULT 0,
    "paragraphsPerChapter" TEXT,
    "wordsPerChapter" TEXT,
    "lastReadAt" INTEGER,
    "chapterPositions" TEXT,
    CONSTRAINT "ReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ReadingProgress" ("bookId", "chapter", "paragraph", "paragraphsPerChapter", "wordsPerChapter", "lastReadAt", "chapterPositions")
  SELECT "bookId", "chapter", "sentence", "sentencesPerChapter", "wordsPerChapter", "lastReadAt", "chapterPositions" FROM "ReadingProgress";
DROP TABLE "ReadingProgress";
ALTER TABLE "new_ReadingProgress" RENAME TO "ReadingProgress";

-- Bookmark: rename sentence→paragraph
CREATE TABLE "new_Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "paragraph" INTEGER NOT NULL,
    "preview" TEXT,
    "createdAt" INTEGER NOT NULL,
    CONSTRAINT "Bookmark_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Bookmark" ("id", "bookId", "chapter", "paragraph", "preview", "createdAt")
  SELECT "id", "bookId", "chapter", "sentence", "preview", "createdAt" FROM "Bookmark";
DROP TABLE "Bookmark";
ALTER TABLE "new_Bookmark" RENAME TO "Bookmark";
CREATE INDEX "Bookmark_bookId_idx" ON "Bookmark"("bookId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
