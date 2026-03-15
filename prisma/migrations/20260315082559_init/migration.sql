-- CreateTable
CREATE TABLE "user" (
    "id" TEXT NOT NULL,
    "role_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "role" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "role_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_type" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "type_id" TEXT NOT NULL,
    "plate_number" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "internal_code" TEXT,
    "status" TEXT NOT NULL,
    "device_id" TEXT,
    "notes" TEXT,
    "current_mileage" INTEGER NOT NULL,
    "engine_hours" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_track_history" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT,
    "device_id" TEXT NOT NULL,
    "speed" INTEGER NOT NULL,
    "battery_voltage" INTEGER NOT NULL,
    "lat" DOUBLE PRECISION NOT NULL,
    "long" DOUBLE PRECISION NOT NULL,
    "angle" INTEGER NOT NULL,
    "ignition" BOOLEAN NOT NULL,
    "movement" BOOLEAN NOT NULL,
    "gsm_signal_strength" INTEGER NOT NULL,
    "total_mileage" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "live_track_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "general_vehicle_part" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "distance_limit" INTEGER NOT NULL,
    "time_limit" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "general_vehicle_part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_part" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "general_vehicle_part_id" TEXT,
    "name" TEXT NOT NULL,
    "last_service" TIMESTAMP(3) NOT NULL,
    "current_distance" INTEGER NOT NULL,
    "distance_limit" INTEGER NOT NULL,
    "time_limit" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_part_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_history" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "current_mileage" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "type" TEXT NOT NULL,
    "cost" INTEGER NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "service_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vehicle_part_service_history" (
    "id" TEXT NOT NULL,
    "vehicle_part_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "vehicle_part_service_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_item" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_item_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_item_criteria" (
    "id" TEXT NOT NULL,
    "inspection_item_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_item_criteria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_report" (
    "id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "image" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "current_mileage" INTEGER NOT NULL,
    "severity" TEXT NOT NULL,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_report_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_item_report" (
    "id" TEXT NOT NULL,
    "inspection_report_id" TEXT NOT NULL,
    "inspection_item_criteria_id" TEXT NOT NULL,
    "check" BOOLEAN NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_item_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_email_key" ON "user"("email");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "role"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle" ADD CONSTRAINT "vehicle_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "vehicle_type"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "live_track_history" ADD CONSTRAINT "live_track_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_part" ADD CONSTRAINT "vehicle_part_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_part" ADD CONSTRAINT "vehicle_part_general_vehicle_part_id_fkey" FOREIGN KEY ("general_vehicle_part_id") REFERENCES "general_vehicle_part"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "service_history" ADD CONSTRAINT "service_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vehicle_part_service_history" ADD CONSTRAINT "vehicle_part_service_history_vehicle_part_id_fkey" FOREIGN KEY ("vehicle_part_id") REFERENCES "vehicle_part"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_item_criteria" ADD CONSTRAINT "inspection_item_criteria_inspection_item_id_fkey" FOREIGN KEY ("inspection_item_id") REFERENCES "inspection_item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_report" ADD CONSTRAINT "inspection_report_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_report" ADD CONSTRAINT "inspection_report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_item_report" ADD CONSTRAINT "inspection_item_report_inspection_report_id_fkey" FOREIGN KEY ("inspection_report_id") REFERENCES "inspection_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_item_report" ADD CONSTRAINT "inspection_item_report_inspection_item_criteria_id_fkey" FOREIGN KEY ("inspection_item_criteria_id") REFERENCES "inspection_item_criteria"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
