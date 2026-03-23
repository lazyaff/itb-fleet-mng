-- AlterTable
ALTER TABLE "general_vehicle_part" ADD COLUMN     "user_id" TEXT;

-- AddForeignKey
ALTER TABLE "general_vehicle_part" ADD CONSTRAINT "general_vehicle_part_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
