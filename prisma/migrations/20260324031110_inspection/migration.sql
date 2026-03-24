/*
  Warnings:

  - You are about to drop the column `current_mileage` on the `inspection_report` table. All the data in the column will be lost.
  - You are about to drop the column `image` on the `inspection_report` table. All the data in the column will be lost.
  - You are about to drop the column `severity` on the `inspection_report` table. All the data in the column will be lost.
  - You are about to drop the `inspection_item` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inspection_item_criteria` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `inspection_item_report` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "inspection_item_criteria" DROP CONSTRAINT "inspection_item_criteria_inspection_item_id_fkey";

-- DropForeignKey
ALTER TABLE "inspection_item_report" DROP CONSTRAINT "inspection_item_report_inspection_item_criteria_id_fkey";

-- DropForeignKey
ALTER TABLE "inspection_item_report" DROP CONSTRAINT "inspection_item_report_inspection_report_id_fkey";

-- AlterTable
ALTER TABLE "inspection_report" DROP COLUMN "current_mileage",
DROP COLUMN "image",
DROP COLUMN "severity",
ADD COLUMN     "conclusion" TEXT;

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "admin_id" TEXT;

-- DropTable
DROP TABLE "inspection_item";

-- DropTable
DROP TABLE "inspection_item_criteria";

-- DropTable
DROP TABLE "inspection_item_report";

-- CreateTable
CREATE TABLE "inspection_section" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "icon" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_section_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_question" (
    "id" TEXT NOT NULL,
    "section_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_option" (
    "id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "value" INTEGER NOT NULL,
    "order" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_option_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "inspection_answer" (
    "id" TEXT NOT NULL,
    "report_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "option_id" TEXT NOT NULL,
    "section_title" TEXT NOT NULL,
    "section_order" INTEGER NOT NULL,
    "section_icon" TEXT NOT NULL,
    "question_title" TEXT NOT NULL,
    "question_order" INTEGER NOT NULL,
    "option_label" TEXT NOT NULL,
    "option_desc" TEXT NOT NULL,
    "option_value" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "inspection_answer_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_admin_id_fkey" FOREIGN KEY ("admin_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_question" ADD CONSTRAINT "inspection_question_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "inspection_section"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_option" ADD CONSTRAINT "inspection_option_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "inspection_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_answer" ADD CONSTRAINT "inspection_answer_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "inspection_report"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_answer" ADD CONSTRAINT "inspection_answer_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "inspection_question"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "inspection_answer" ADD CONSTRAINT "inspection_answer_option_id_fkey" FOREIGN KEY ("option_id") REFERENCES "inspection_option"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
