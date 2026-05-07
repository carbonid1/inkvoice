-- CreateTable
CREATE TABLE "CacheEntry" (
    "hash" TEXT NOT NULL PRIMARY KEY,
    "bookId" TEXT,
    "voice" TEXT NOT NULL,
    "sizeBytes" INTEGER NOT NULL,
    "durationMs" INTEGER,
    "createdAt" INTEGER NOT NULL
);

-- CreateIndex
CREATE INDEX "CacheEntry_bookId_voice_idx" ON "CacheEntry"("bookId", "voice");

-- CreateIndex
CREATE INDEX "CacheEntry_bookId_idx" ON "CacheEntry"("bookId");
