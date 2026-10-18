CREATE TABLE "ProjectSlugRedirect" (
    "oldSlug" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProjectSlugRedirect_pkey" PRIMARY KEY ("oldSlug")
);

CREATE TABLE "BlogPostSlugRedirect" (
    "oldSlug" TEXT NOT NULL,
    "blogPostId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "BlogPostSlugRedirect_pkey" PRIMARY KEY ("oldSlug")
);

CREATE INDEX "ProjectSlugRedirect_projectId_idx" ON "ProjectSlugRedirect"("projectId");
CREATE INDEX "BlogPostSlugRedirect_blogPostId_idx" ON "BlogPostSlugRedirect"("blogPostId");

ALTER TABLE "ProjectSlugRedirect" ADD CONSTRAINT "ProjectSlugRedirect_projectId_fkey"
  FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BlogPostSlugRedirect" ADD CONSTRAINT "BlogPostSlugRedirect_blogPostId_fkey"
  FOREIGN KEY ("blogPostId") REFERENCES "BlogPost"("id") ON DELETE CASCADE ON UPDATE CASCADE;
