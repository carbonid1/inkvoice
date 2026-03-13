-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "filename" TEXT NOT NULL,
    "addedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "ReadingProgress" (
    "bookId" TEXT NOT NULL PRIMARY KEY,
    "chapter" INTEGER NOT NULL DEFAULT 0,
    "sentence" INTEGER NOT NULL DEFAULT 0,
    "totalChapters" INTEGER,
    "sentencesPerChapter" TEXT,
    "wordsPerChapter" TEXT,
    "lastReadAt" INTEGER,
    "chapterPositions" TEXT,
    CONSTRAINT "ReadingProgress_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Bookmark" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT NOT NULL,
    "chapter" INTEGER NOT NULL,
    "sentence" INTEGER NOT NULL,
    "label" TEXT,
    "preview" TEXT,
    "createdAt" INTEGER NOT NULL,
    CONSTRAINT "Bookmark_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoicePreference" (
    "bookId" TEXT NOT NULL PRIMARY KEY,
    "voiceName" TEXT NOT NULL,
    CONSTRAINT "VoicePreference_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "VoiceMetadata" (
    "name" TEXT NOT NULL PRIMARY KEY,
    "displayName" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "tags" TEXT NOT NULL DEFAULT '[]'
);

-- CreateTable
CREATE TABLE "UserSetting" (
    "key" TEXT NOT NULL PRIMARY KEY,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE INDEX "Bookmark_bookId_idx" ON "Bookmark"("bookId");
