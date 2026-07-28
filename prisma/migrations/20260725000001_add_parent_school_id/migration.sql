-- Add schoolId to parents table (nullable for independent parents)
ALTER TABLE "parents" ADD COLUMN "school_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "parents" ADD CONSTRAINT "parents_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;
