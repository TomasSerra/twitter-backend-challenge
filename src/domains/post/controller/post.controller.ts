import { NextFunction, Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors';

import { BodyValidation, db } from '@utils';

import { PostRepositoryImpl } from '../repository';
import { PostService, PostServiceImpl } from '../service';
import { PostContentDTO } from '../dto';
import { UserRepositoryImpl } from '@domains/user/repository';

export const postRouter = Router();

// Use dependency injection
const service: PostService = new PostServiceImpl(new PostRepositoryImpl(db), new UserRepositoryImpl(db));

/**
 * @openapi
 * components:
 *   schemas:
 *     CreatePostDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user creating the post.
 *         content:
 *           type: string
 *           maxLength: 240
 *           description: The text content of the post.
 *         images:
 *           type: array
 *           maxItems: 4
 *           items:
 *             type: string
 *             maxLength: 100
 *           description: (Optional) An array of image URLs (up to 4).
 *
 *     PostContentDTO:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           maxLength: 240
 *           description: The text content of the post.
 *         images:
 *           type: array
 *           maxItems: 4
 *           items:
 *             type: string
 *             maxLength: 100
 *           description: (Optional) An array of image URLs (up to 4).
 *
 *     PostDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The UUID of the post.
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user who created the post.
 *         content:
 *           type: string
 *           description: The text content of the post.
 *         images:
 *           type: array
 *           items:
 *             type: string
 *           description: An array of image URLs.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the post was created.
 *
 *     PostsByAuthorDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the requesting user.
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the author whose posts to retrieve.
 *
 *     GetPostDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the requesting user.
 *         postId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the post to retrieve.
 *
 *     DeletePostDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user requesting to delete the post.
 *         postId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the post to delete.
 *
 *     PreSignedUrl:
 *       type: object
 *       properties:
 *         signedUrl:
 *           type: string
 *           description: The pre-signed URL for uploading the file.
 *         key:
 *           type: string
 *           description: The key (filename) to use when uploading the file.
 *
 *     ExtendedPostDTO:
 *       allOf:
 *         - $ref: '#/components/schemas/PostDTO'
 *         - type: object
 *           properties:
 *             author:
 *               $ref: '#/components/schemas/ExtendedUserDTO'
 *             qtyComments:
 *               type: integer
 *               description: The number of comments on the post.
 *             qtyLikes:
 *               type: integer
 *               description: The number of likes on the post.
 *             qtyRetweets:
 *               type: integer
 *               description: The number of retweets of the post.
 */


/**
 * @openapi
 * /post:
 *   get:
 *     summary: Get Latest Posts
 *     description: Retrieves a paginated list of the latest posts, optionally filtered by a cursor for pagination.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 10
 *         description: The maximum number of posts to return per page.
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *           format: date-time
 *         description: (Optional) A cursor representing the date and time before which to fetch posts.
 *       - in: query
 *         name: after
 *         schema:
 *           type: string
 *           format: date-time
 *         description: (Optional) A cursor representing the date and time after which to fetch posts.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExtendedPostDTO'
 *       401:
 *         description: Returns an error if the user is not authenticated.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized. You must login to access this content."
 *       404:
 *         description: Returns an error if no posts have been found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Posts Not Found"
 */
postRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const { limit, before, after } = req.query as Record<string, string>;

  try {
    const posts = await service.getLatestPosts(userId, { limit: Number(limit), before, after });

    return res.status(HttpStatus.OK).json(posts);
  } catch (e) {
    next(e);
  }
});


/**
 * @openapi
 * /post/{postId}:
 *   get:
 *     summary: Get Post by ID
 *     description: Retrieves a single post by ID, if the user has permission to view it (either the post is public or the user is following the author).
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the post to retrieve.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostDTO'
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
 *                   example: 400
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
 *                   example: 401
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
 *                   example: 403
 *       404:
 *         description: Post not found
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
 *                   example: 404
 */
postRouter.get('/:postId', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const { postId } = req.params;

  try {
    const post = await service.getPost(userId, postId);

    return res.status(HttpStatus.OK).json(post);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /post/by_user/{userId}:
 *   get:
 *     summary: Get Posts by Author
 *     description: Retrieves all posts made by a specific author (user). Requires authentication. The requesting user must be following the author or the author's profile must be public.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the user (author) whose posts you want to retrieve.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ExtendedPostDTO'
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
 *                   example: 400
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
 *                   example: 401
 *                 error_code:
 *                   type: string
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
 *         description: Author not found or no posts found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find authors"
 *                 code:
 *                   type: integer
 */

postRouter.get('/by_user/:userId', async (req: Request, res: Response, next: NextFunction) => {
  const userId = res.locals.context.userId;
  const authorId = req.params.userId;
  console.log(authorId);
  try {
    const posts = await service.getPostsByAuthor(userId, authorId);

    return res.status(HttpStatus.OK).json(posts);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /post/:
 *   post:
 *     summary: Create a New Post
 *     description: Creates a new post with text content and optional images (up to 4) for the authenticated user.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Post content details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/PostContentDTO'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PostDTO'
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
postRouter.post('/', BodyValidation(PostContentDTO), async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const data = req.body;
  console.log(`data is${data as string}`);
  console.log(`userId: ${userId as string}`);

  try {
    const post = await service.createPost(userId, data.content, data.images);

    return res.status(HttpStatus.CREATED).json(post);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /post/{postId}:
 *   delete:
 *     summary: Delete a Post
 *     description: Deletes a post by ID if the authenticated user is the owner of the post.
 *     tags:
 *       - Posts
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: postId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the post to delete.
 *     responses:
 *       200:
 *         description: Post deleted successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "Deleted post 12345678-1234-1234-1234-123456789012"
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
 *         description: Post not found
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
postRouter.delete('/:postId', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const { postId } = req.params;

  try {
    await service.deletePost(userId, postId);

    return res.status(HttpStatus.OK).send(`Deleted post ${postId}`);
  } catch (e) {
    next(e);
  }
});
