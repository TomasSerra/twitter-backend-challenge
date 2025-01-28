import { NextFunction, Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
import 'express-async-errors';

import { BodyValidation, db } from '@utils';

import { CommentRepositoryImpl } from '../repository';
import { CommentService, CommentServiceImpl } from '../service';
import { PostContentDTO } from '@domains/post/dto';
import { UserRepositoryImpl } from '@domains/user/repository';

export const commentRouter = Router();

// User dependency injection
const service: CommentService = new CommentServiceImpl(new CommentRepositoryImpl(db), new UserRepositoryImpl(db));

/**
 * @openapi
 * components:
 *   schemas:
 *     CommentDTO:
 *       allOf:
 *         - $ref: '#/components/schemas/PostDTO'
 *         - type: object
 *           properties:
 *             parentPostId:
 *               type: string
 *               format: uuid
 *               description: The UUID of the parent post to which this comment belongs.
 *
 *     DeleteCommentDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user requesting to delete the comment.
 *         postId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the comment to delete.
 *
 *     GetCommentDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user requesting the comment.
 *         postId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the comment to retrieve.
 *
 *     GetCommentsFromUserDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user requesting the comments.
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the author whose comments to retrieve.
 *
 *     GetParentPostDTO:
 *       type: object
 *       properties:
 *         parentPostId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the parent post to retrieve.
 */

/**
 * @openapi
 * /comment/{postId}:
 *   get:
 *     summary: Get Comments for a Post
 *     description: Retrieves a paginated list of comments for a given post, along with the parent post details.  The user must be following the author of the post or the post must be public.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the post to fetch comments for.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: The maximum number of comments to return per page.
 *       - in: query
 *         name: skip
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: The number of comments to skip (for pagination).
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 parentPost:
 *                   $ref: '#/components/schemas/ExtendedPostDTO'
 *                   nullable: true
 *                 comments:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/CommentDTO'
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation Error"
 *                 code:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: An array of validation error details.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized. You must login to access this content."
 *                 code:
 *                   type: integer
 *                 error_code:
 *                   type: string
 *                   example: "auth_error_code"
 *       403:
 *         description: Forbidden. You are not allowed to perform this action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden. You are not allowed to perform this action"
 *                 code:
 *                   type: integer
 *       404:
 *         description: Post not found or No comments found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find post"
 *                 code:
 *                   type: integer
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 *                 code:
 *                   type: integer
 */
commentRouter.get('/:postId', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const { postId } = req.params;
  const { limit, skip } = req.query as Record<string, string>;

  try {
    const comments = await service.getAllCommentsFromPostPaginated(userId, postId, {
      limit: Number(limit),
      skip: Number(skip),
    });

    return res.status(HttpStatus.OK).json({
      comments,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /comment/{commentId}:
 *   get:
 *     summary: Get Comment by ID
 *     description: Retrieves a single comment by ID, if the user has permission to view it (either the comment is on a public post or the user is following the author).
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: commentId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the comment to retrieve.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentDTO'
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation Error"
 *                 code:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: An array of validation error details.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized. You must login to access this content."
 *                 code:
 *                   type: integer
 *                 error_code:
 *                   type: string
 *                   example: "auth_error_code"
 *       403:
 *         description: Forbidden. You are not allowed to perform this action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden. You are not allowed to perform this action"
 *                 code:
 *                   type: integer
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find comment"
 *                 code:
 *                   type: integer
 */
commentRouter.get('/:commentId', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const { commentId } = req.params;

  try {
    const comment = await service.getComment(userId, commentId);
    return res.status(HttpStatus.OK).json(comment);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /comment/user/{userId}:
 *   get:
 *     summary: Get Comments by User
 *     description: Retrieves all comments made by a specific user (author). Requires authentication. The requesting user must be following the author or the author's profile must be public.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the user (author) whose comments you want to retrieve.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/CommentDTO'
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation Error"
 *                 code:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: An array of validation error details.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized. You must login to access this content."
 *                 code:
 *                   type: integer
 *                 error_code:
 *                   type: string
 *                   example: "auth_error_code"
 *       403:
 *         description: Forbidden. You are not allowed to perform this action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden. You are not allowed to perform this action"
 *                 code:
 *                   type: integer
 *       404:
 *         description: No comments found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find comments"
 *                 code:
 *                   type: integer
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 *                 code:
 *                   type: integer
 */
commentRouter.get('/user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const { userId: authorId } = req.params;

  try {
    const comments = await service.getAllCommentsFromUser(userId, authorId);
    return res.status(HttpStatus.OK).json(comments);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /comment/{postId}:
 *   post:
 *     summary: Create a New Comment
 *     description: Creates a new comment for a given post. Requires authentication.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the post to create a comment on.
 *     requestBody:
 *       description: Comment content details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostContentDTO'
 *     responses:
 *       201:
 *         description: Comment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CommentDTO'
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation Error"
 *                 code:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: An array of validation error details.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized. You must login to access this content."
 *                 code:
 *                   type: integer
 *                 error_code:
 *                   type: string
 *                   example: "auth_error_code"
 *       404:
 *         description: User or post not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find user does not exists"
 *                 code:
 *                   type: integer
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 *                 code:
 *                   type: integer
 */
commentRouter.post(
  '/:postId',
  BodyValidation(PostContentDTO),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = res.locals.context;
    const { postId } = req.params;
    const data = req.body;

    try {
      const comment = await service.createComment(userId, postId, data);
      return res.status(HttpStatus.CREATED).json(comment);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /comment/{postId}:
 *   delete:
 *     summary: Delete a Comment
 *     description: Deletes a comment by ID if the authenticated user is the owner of the comment.
 *     tags:
 *       - Comments
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the comment to delete.
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Deleted comment 12345678-1234-1234-1234-123456789012"
 *       400:
 *         description: Validation Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Validation Error"
 *                 code:
 *                   type: integer
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                   description: An array of validation error details.
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized. You must login to access this content."
 *                 code:
 *                   type: integer
 *                 error_code:
 *                   type: string
 *                   example: "auth_error_code"
 *       403:
 *         description: Forbidden. You are not allowed to perform this action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden. You are not allowed to perform this action"
 *                 code:
 *                   type: integer
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find comment"
 *                 code:
 *                   type: integer
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "An unexpected error occurred."
 *                 code:
 *                   type: integer
 */
commentRouter.delete('/:postId', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const { postId } = req.params;

  console.log(userId, postId);

  try {
    await service.deleteComment(userId, postId);
    return res.status(HttpStatus.OK).send(`Deleted comment ${postId}`);
  } catch (e) {
    next(e);
  }
});
