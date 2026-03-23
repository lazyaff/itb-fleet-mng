/*
  Warnings:

  - You are about to drop the column `device_id` on the `live_track_history` table. All the data in the column will be lost.
  - You are about to drop the column `device_id` on the `vehicle` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[gps_tracker_id]` on the table `vehicle` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `gps_tracker_id` to the `live_track_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "live_track_history" DROP COLUMN "device_id",
ADD COLUMN     "gps_tracker_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "vehicle" DROP COLUMN "device_id",
ADD COLUMN     "gps_tracker_id" TEXT;

-- CreateTable
CREATE TABLE "gps_tracker" (
    "id" TEXT NOT NULL,
    "imei" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "gps_tracker_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "vehicle_gps_tracker_id_key" ON "vehicle"("gps_tracker_id");

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_gps_tracker_id_fkey" FOREIGN KEY ("gps_tracker_id") REFERENCES "gps_tracker"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_track_history" ADD CONSTRAINT "live_track_history_gps_tracker_id_fkey" FOREIGN KEY ("gps_tracker_id") REFERENCES "gps_tracker"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
