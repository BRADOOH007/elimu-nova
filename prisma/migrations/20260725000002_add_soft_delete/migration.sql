-- Add soft delete columns
ALTER TABLE "teachers" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "students" ADD COLUMN "deleted_at" TIMESTAMP(3);
ALTER TABLE "classes" ADD COLUMN "deleted_at" TIMESTAMP(3);
