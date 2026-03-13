-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;

-- Remove addedAt from Book
CREATE TABLE "new_Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "filename" TEXT NOT NULL
);
INSERT INTO "new_Book" ("id", "title", "author", "filename") SELECT "id", "title", "author", "filename" FROM "Book";
DROP TABLE "Book";
ALTER TABLE "new_Book" RENAME TO "Book";

-- Remove label from Bookmark
CREATE TABLE "new_Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "sentence" INTEGER NOT NULL,
    "preview" TEXT,
    "createdAt" INTEGER NOT NULL,
    CONSTRAINT "Bookmark_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Bookmark" ("id", "bookId", "chapter", "sentence", "preview", "createdAt") SELECT "id", "bookId", "chapter", "sentence", "preview", "createdAt" FROM "Bookmark";
DROP TABLE "Bookmark";
ALTER TABLE "new_Bookmark" RENAME TO "Bookmark";
CREATE INDEX "Bookmark_bookId_idx" ON "Bookmark"("bookId");

PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
