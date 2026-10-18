CREATE TABLE "CaseStudyImage" (
    "caseStudyId" TEXT NOT NULL,
    "mediaAssetId" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "CaseStudyImage_pkey" PRIMARY KEY ("caseStudyId", "mediaAssetId")
);

CREATE INDEX "CaseStudyImage_mediaAssetId_idx" ON "CaseStudyImage"("mediaAssetId");
CREATE INDEX "CaseStudyImage_caseStudyId_sortOrder_idx" ON "CaseStudyImage"("caseStudyId", "sortOrder");

ALTER TABLE "CaseStudyImage" ADD CONSTRAINT "CaseStudyImage_caseStudyId_fkey"
  FOREIGN KEY ("caseStudyId") REFERENCES "CaseStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "CaseStudyImage" ADD CONSTRAINT "CaseStudyImage_mediaAssetId_fkey"
  FOREIGN KEY ("mediaAssetId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Project" DROP CONSTRAINT "Project_coverImageId_fkey";
ALTER TABLE "Project" ADD CONSTRAINT "Project_coverImageId_fkey"
  FOREIGN KEY ("coverImageId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "BlogPost" DROP CONSTRAINT "BlogPost_coverImageId_fkey";
ALTER TABLE "BlogPost" ADD CONSTRAINT "BlogPost_coverImageId_fkey"
  FOREIGN KEY ("coverImageId") REFERENCES "MediaAsset"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
