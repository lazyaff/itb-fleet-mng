/*
  Warnings:

  - A unique constraint covering the columns `[usage_reconciliation_id]` on the table `live_track_history` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "live_track_history" ADD COLUMN     "usage_reconciliation_id" TEXT;

-- CreateTable
CREATE TABLE "vehicle_usage_history" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "image" TEXT,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_usage_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_reconciliation" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "vehicle_usage_history_id" TEXT,
    "source" TEXT NOT NULL,
    "previous_mileage" INTEGER NOT NULL,
    "current_mileage" INTEGER NOT NULL,
    "difference" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "usage_reconciliation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "live_track_history_usage_reconciliation_id_key" ON "live_track_history"("usage_reconciliation_id");

-- AddForeignKey
ALTER TABLE "vehicle_usage_history" ADD CONSTRAINT "vehicle_usage_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_track_history" ADD CONSTRAINT "live_track_history_usage_reconciliation_id_fkey" FOREIGN KEY ("usage_reconciliation_id") REFERENCES "usage_reconciliation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_reconciliation" ADD CONSTRAINT "usage_reconciliation_vehicle_usage_history_id_fkey" FOREIGN KEY ("vehicle_usage_history_id") REFERENCES "vehicle_usage_history"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_reconciliation" ADD CONSTRAINT "usage_reconciliation_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
