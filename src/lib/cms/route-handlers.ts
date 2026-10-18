import "server-only";
import { prisma } from "@/lib/prisma";
import { requireAdminApi } from "@/lib/auth/require-admin-api";
import { revalidatePath } from "next/cache";
import { createCollectionHandlers, createItemHandlers } from "@/lib/cms/http.mjs";
import * as projectService from "@/lib/cms/projects.mjs";
import * as postService from "@/lib/cms/posts.mjs";
import * as caseStudyService from "@/lib/cms/case-studies.mjs";
import { createCmsMutationRevalidator, pathsForCaseStudyMutation, pathsForPostMutation, pathsForProjectMutation } from "@/lib/cms/revalidation.mjs";

const projectRevalidation = createCmsMutationRevalidator(revalidatePath, pathsForProjectMutation);
const postRevalidation = createCmsMutationRevalidator(revalidatePath, pathsForPostMutation);
const caseStudyRevalidation = createCmsMutationRevalidator(revalidatePath, pathsForCaseStudyMutation);

export const projectCollectionHandlers = createCollectionHandlers({
  authorize: requireAdminApi,
  db: prisma,
  service: { list: projectService.listProjects, create: projectService.createProject },
  filters: ["visibility", "featured", "category"],
  afterMutation: projectRevalidation,
});
export const projectItemHandlers = createItemHandlers({
  authorize: requireAdminApi,
  db: prisma,
  service: { get: projectService.getProject, update: projectService.updateProject, delete: projectService.deleteProject },
  afterMutation: projectRevalidation,
});
export const postCollectionHandlers = createCollectionHandlers({
  authorize: requireAdminApi,
  db: prisma,
  service: { list: postService.listPosts, create: postService.createPost },
  filters: ["status", "category"],
  afterMutation: postRevalidation,
});
export const postItemHandlers = createItemHandlers({
  authorize: requireAdminApi,
  db: prisma,
  service: { get: postService.getPost, update: postService.updatePost, delete: postService.deletePost },
  afterMutation: postRevalidation,
});
export const caseStudyCollectionHandlers = createCollectionHandlers({
  authorize: requireAdminApi,
  db: prisma,
  service: { list: caseStudyService.listCaseStudies, create: caseStudyService.createCaseStudy },
  filters: ["status", "projectId"],
  afterMutation: caseStudyRevalidation,
});
export const caseStudyItemHandlers = createItemHandlers({
  authorize: requireAdminApi,
  db: prisma,
  service: { get: caseStudyService.getCaseStudy, update: caseStudyService.updateCaseStudy, delete: caseStudyService.deleteCaseStudy },
  afterMutation: caseStudyRevalidation,
});
