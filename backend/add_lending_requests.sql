-- CreateEnum
CREATE TYPE "LendingStatus" AS ENUM ('PENDING', 'APPROVED', 'DELIVERED', 'REJECTED', 'RETURNED', 'CANCELLED');

-- CreateTable
CREATE TABLE "LendingRequest" (
    "id" TEXT NOT NULL,
    "bookId" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "status" "LendingStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "LendingRequest_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LendingRequest_bookId_idx" ON "LendingRequest"("bookId");

-- CreateIndex
CREATE INDEX "LendingRequest_requesterId_idx" ON "LendingRequest"("requesterId");

-- CreateIndex
CREATE INDEX "LendingRequest_status_idx" ON "LendingRequest"("status");

-- AddForeignKey
ALTER TABLE "LendingRequest" ADD CONSTRAINT "LendingRequest_bookId_fkey" FOREIGN KEY ("bookId") REFERENCES "Book"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LendingRequest" ADD CONSTRAINT "LendingRequest_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
