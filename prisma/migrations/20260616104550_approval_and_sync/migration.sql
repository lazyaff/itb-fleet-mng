/*
  Warnings:

  - A unique constraint covering the columns `[approval_request_id]` on the table `fuel_log` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[approval_request_id]` on the table `service_history` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[approval_request_id]` on the table `vehicle_part` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "fuel_log" ADD COLUMN     "approval_request_id" TEXT;

-- AlterTable
ALTER TABLE "service_history" ADD COLUMN     "approval_request_id" TEXT;

-- AlterTable
ALTER TABLE "vehicle" ADD COLUMN     "assigned_unit" TEXT,
ADD COLUMN     "brand" TEXT,
ADD COLUMN     "category" TEXT,
ADD COLUMN     "plate_color" TEXT,
ADD COLUMN     "sync_status" TEXT NOT NULL DEFAULT 'synced',
ADD COLUMN     "type" TEXT,
ADD COLUMN     "usage_type" TEXT,
ADD COLUMN     "visibility" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "vehicle_part" ADD COLUMN     "approval_request_id" TEXT;

-- CreateTable
CREATE TABLE "vehicle_sync_history" (
    "id" TEXT NOT NULL,
    "approval_request_id" TEXT,
    "data" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_sync_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "approval_request" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "description_id" TEXT NOT NULL,
    "description_en" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "rejection_reason" TEXT,
    "requested_by_id" TEXT NOT NULL,
    "requested_at" TIMESTAMP(3) NOT NULL,
    "approved_by_id" TEXT,
    "approved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "approval_request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_sync_history_approval_request_id_key" ON "vehicle_sync_history"("approval_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "fuel_log_approval_request_id_key" ON "fuel_log"("approval_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "service_history_approval_request_id_key" ON "service_history"("approval_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_part_approval_request_id_key" ON "vehicle_part"("approval_request_id");

-- AddForeignKey
ALTER TABLE "vehicle_sync_history" ADD CONSTRAINT "vehicle_sync_history_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_part" ADD CONSTRAINT "vehicle_part_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "fuel_log" ADD CONSTRAINT "fuel_log_approval_request_id_fkey" FOREIGN KEY ("approval_request_id") REFERENCES "approval_request"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "approval_request" ADD CONSTRAINT "approval_request_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
