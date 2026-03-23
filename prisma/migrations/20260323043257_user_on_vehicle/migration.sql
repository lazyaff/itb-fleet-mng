-- DropForeignKey
ALTER TABLE "vehicle" DROP CONSTRAINT "vehicle_user_id_fkey";

-- AlterTable
ALTER TABLE "vehicle" ALTER COLUMN "user_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
