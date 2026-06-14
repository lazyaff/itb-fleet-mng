-- CreateTable
CREATE TABLE "inspection_form_version" (
    "id" TEXT NOT NULL,
    "version" INTEGER NOT NULL,
    "fields" JSONB NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT false,
    "published_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "inspection_form_version_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_dynamic_report" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "vehicle_id" TEXT NOT NULL,
    "form_version_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "conclusion" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_dynamic_report_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "inspection_form_version_is_active_idx" ON "inspection_form_version"("is_active");

-- AddForeignKey
ALTER TABLE "inspection_dynamic_report" ADD CONSTRAINT "inspection_dynamic_report_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_dynamic_report" ADD CONSTRAINT "inspection_dynamic_report_vehicle_id_fkey" FOREIGN KEY ("vehicle_id") REFERENCES "vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_dynamic_report" ADD CONSTRAINT "inspection_dynamic_report_form_version_id_fkey" FOREIGN KEY ("form_version_id") REFERENCES "inspection_form_version"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
