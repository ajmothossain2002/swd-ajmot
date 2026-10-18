CREATE TABLE "CmsContentInitialization" (
    "key" TEXT NOT NULL,
    "sourceHash" TEXT NOT NULL,
    "expectedProjects" INTEGER NOT NULL,
    "expectedCaseStudies" INTEGER NOT NULL,
    "expectedBlogPosts" INTEGER NOT NULL,
    "projectsCreated" INTEGER NOT NULL,
    "projectsSkipped" INTEGER NOT NULL,
    "caseStudiesCreated" INTEGER NOT NULL,
    "caseStudiesSkipped" INTEGER NOT NULL,
    "blogPostsCreated" INTEGER NOT NULL,
    "blogPostsSkipped" INTEGER NOT NULL,
    "completedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CmsContentInitialization_pkey" PRIMARY KEY ("key")
);
