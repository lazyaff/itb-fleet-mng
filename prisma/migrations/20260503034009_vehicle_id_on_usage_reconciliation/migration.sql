/*
  Warnings:

  - Added the required column `vehicle_id` to the `usage_reconciliation` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "usage_reconciliation" ADD COLUMN     "vehicle_id" TEXT NOT NULL;

-- AddForeignKey
ALTER TABLE "usage_reconciliation" ADD CONSTRAINT "usage_reconciliation_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
