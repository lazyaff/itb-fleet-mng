/*
  Warnings:

  - A unique constraint covering the columns `[gps_tracker_id,created_at]` on the table `live_track_history` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "live_track_history_gps_tracker_id_created_at_key" ON "live_track_history"("gps_tracker_id", "created_at");
