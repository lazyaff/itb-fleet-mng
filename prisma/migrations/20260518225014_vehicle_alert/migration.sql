-- CreateTable
CREATE TABLE "vehicle_alert" (
    "id" TEXT NOT NULL,
    "vehicle_part_id" TEXT NOT NULL,
    "time_limit_reached" BOOLEAN NOT NULL DEFAULT false,
    "distance_limit_reached" BOOLEAN NOT NULL DEFAULT false,
    "active" BOOLEAN NOT NULL,
    "triggered_at" TIMESTAMP(3) NOT NULL,
    "resolved_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_alert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "vehicle_alert_active_idx" ON "vehicle_alert"("active");

-- CreateIndex
CREATE INDEX "vehicle_alert_vehicle_part_id_idx" ON "vehicle_alert"("vehicle_part_id");

-- AddForeignKey
ALTER TABLE "vehicle_alert" ADD CONSTRAINT "vehicle_alert_vehicle_part_id_fkey" FOREIGN KEY ("vehicle_part_id") REFERENCES "vehicle_part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
