import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import {
  createCommentarySchema,
  listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { desc, eq } from "drizzle-orm";

export const commentaryRouter = Router({ mergeParams: true });

const MAX_LIMIT = 100;

commentaryRouter.get("/", async (req, res) => {
  try {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid Params",
        details: parsedParams.error.issues,
      });
    }

    const parsedQuery = listCommentaryQuerySchema.safeParse(req.query);

    if (!parsedQuery.success) {
      return res.status(400).json({
        error: "Invalid Query",
        details: parsedQuery.error.issues,
      });
    }

    const limit = Math.min(parsedQuery.data.limit ?? MAX_LIMIT, MAX_LIMIT);

    const data = await db
      .select()
      .from(commentary)
      .where(eq(commentary.matchId, parsedParams.data.id))
      .orderBy(desc(commentary.createdAt))
      .limit(limit);

    return res.status(200).json({ data });
  } catch (e) {
    return res.status(500).json({
      error: "Failed to list commentary",
      details: JSON.stringify(e),
    });
  }
});

commentaryRouter.post("/", async (req, res) => {
  try {
    const parsedParams = matchIdParamSchema.safeParse(req.params);

    if (!parsedParams.success) {
      return res.status(400).json({
        error: "Invalid Params",
        details: parsedParams.error.issues,
      });
    }

    const parsedBody = createCommentarySchema.safeParse(req.body);

    if (!parsedBody.success) {
      return res.status(400).json({
        error: "Invalid Payload",
        details: parsedBody.error.issues,
      });
    }

    const [event] = await db
      .insert(commentary)
      .values({
        ...parsedBody.data,
        matchId: parsedParams.data.id,
      })
      .returning();

    if (res.app.locals.broadcastCommentary) {
      res.app.locals.broadcastCommentary(event.matchId, event);
    }

    return res.status(201).json({ data: event });
  } catch (e) {
    return res.status(500).json({
      error: "Failed to create commentary",
      details: JSON.stringify(e),
    });
  }
});
