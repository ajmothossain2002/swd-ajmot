-- Case studies can be drafted/published independently and must not disappear
-- implicitly when an associated project is deleted.
ALTER TABLE "CaseStudy"
  ADD COLUMN "status" "PublicationStatus" NOT NULL DEFAULT 'DRAFT',
  ADD COLUMN "publishedAt" TIMESTAMP(3);

CREATE INDEX "CaseStudy_status_publishedAt_idx"
  ON "CaseStudy"("status", "publishedAt");

ALTER TABLE "CaseStudy"
  DROP CONSTRAINT "CaseStudy_projectId_fkey";

ALTER TABLE "CaseStudy"
  ADD CONSTRAINT "CaseStudy_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;
