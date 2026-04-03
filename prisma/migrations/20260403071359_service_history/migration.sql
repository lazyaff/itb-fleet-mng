/*
  Warnings:

  - Added the required column `is_all` to the `service_history` table without a default value. This is not possible if the table is not empty.
  - Added the required column `service_history_id` to the `vehicle_part_service_history` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "service_history" ADD COLUMN     "is_all" BOOLEAN NOT NULL;

-- AlterTable
ALTER TABLE "vehicle_part_service_history" ADD COLUMN     "service_history_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "vehicle_part_service_history" ADD CONSTRAINT "vehicle_part_service_history_service_history_id_fkey" FOREIGN KEY ("service_history_id") REFERENCES "service_history"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
