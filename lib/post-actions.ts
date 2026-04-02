import { db } from "@/lib/db";
import { incrementAnalysis } from "@/lib/user";
import { generateLocalComments, generateLocalFeedback } from "@/lib/local-ai";
import type { AIComment, AIFeedback, Post } from "@/types";

export async function analyzePostLocally(post: Post): Promise<{ feedback: AIFeedback; comments: AIComment[] }> {
  if (!post.id) {
    throw new Error("Missing post id");
  }

  const feedback = generateLocalFeedback(post.image, new Date(post.createdAt));
  const comments = generateLocalComments(feedback);

  await incrementAnalysis();
  await db.posts.update(post.id, { aiFeedback: feedback, aiComments: comments });

  return { feedback, comments };
}

export async function regeneratePostCommentsLocally(post: Post): Promise<AIComment[]> {
  if (!post.id) {
    throw new Error("Missing post id");
  }

  const feedback = post.aiFeedback ?? generateLocalFeedback(post.image, new Date(post.createdAt));
  const comments = generateLocalComments(feedback);

  const changes: Partial<Post> = post.aiFeedback
    ? { aiComments: comments }
    : { aiFeedback: feedback, aiComments: comments };

  await db.posts.update(post.id, changes);
  return comments;
}
