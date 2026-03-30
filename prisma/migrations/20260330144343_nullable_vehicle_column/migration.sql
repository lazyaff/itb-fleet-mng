-- DropForeignKey
ALTER TABLE "vehicle" DROP CONSTRAINT "vehicle_type_id_fkey";

-- AlterTable
ALTER TABLE "vehicle" ALTER COLUMN "type_id" DROP NOT NULL,
ALTER COLUMN "image" DROP NOT NULL,
ALTER COLUMN "engine_hours" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "vehicle_type"("id") ON DELETE SET NULL ON UPDATE CASCADE;
