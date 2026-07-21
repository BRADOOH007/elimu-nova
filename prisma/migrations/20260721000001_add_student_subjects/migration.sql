-- AlterTable: added subjects array to Student model for multi-subject assignment
ALTER TABLE "students" ADD COLUMN "subjects" TEXT[] DEFAULT '{}' NOT NULL;
