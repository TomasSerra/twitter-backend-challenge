import { NextFunction, Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors';

import { BodyValidation, db } from '@utils';

import { ReactionRepositoryImpl } from '../repository';
import { ReactionService, ReactionServiceImpl } from '@domains/reaction/service';
import { CreateReactionDTO, DeleteReactionDTO, ReactionActionDTO } from '@domains/reaction/dto';
import { UserRepositoryImpl } from '@domains/user/repository';

export const reactionRouter = Router();

// Use dependency injection
const service: ReactionService = new ReactionServiceImpl(new ReactionRepositoryImpl(db), new UserRepositoryImpl(db));

/**
 * @openapi
 * components:
 *   schemas:
 *     ReactionDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier of the reaction.
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user who created the reaction.
 *         postId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the post the reaction is associated with.
 *         action:
 *           type: string
 *           enum: [LIKE, DISLIKE]
 *           description: The type of reaction (LIKE or DISLIKE).
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: Date and time when the reaction was created.
 *
 *     ReactionActionDTO:
 *       type: object
 *       properties:
 *         action:
 *           type: string
 *           enum: [LIKE, DISLIKE]
 *           description: The type of reaction (LIKE or DISLIKE).
 *
 *     DeleteReactionDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user requesting to delete the reaction.
 *         postId:
 *           type: string
 *           description: The ID of the post associated with the reaction.
 *         action:
 *           type: string
 *           enum: [LIKE, DISLIKE]
 *           description: The type of reaction to delete (LIKE or DISLIKE).
 *
 *     GetReactionDTO:
 *       type: object
 *       properties:
 *         reactionId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the reaction to retrieve.
 *
 *     GetReactionsFromUserDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user requesting the reactions.
 *         authorId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user whose reactions to retrieve.
 *
 *     GetReactionsFromPostDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user requesting the reactions.
 *         postId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the post whose reactions to retrieve.
 *
 *     CreateReactionDTO:
 *       type: object
 *       properties:
 *         userId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user creating the reaction.
 *         postId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the post the reaction is associated with.
 *         action:
 *           type: string
 *           enum: [LIKE, DISLIKE]
 *           description: The type of reaction (LIKE or DISLIKE).
 */

/**
 * @openapi
 * /reaction/likes:
 *   get:
 *     summary: Get All Likes from a User
 *     description: Retrieves all likes made by a specific user (author). Requires authentication. The requesting user must be following the author or the author's profile must be public.
 *     tags:
 *       - Reactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the user (author) whose likes you want to retrieve.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReactionDTO'
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
 *         description: No reactions found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find reactions"
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
reactionRouter.get('/likes', async (req: Request, res: Response, next: NextFunction) => {
  const { authorId } = req.query;
  const { userId } = res.locals.context;

  try {
    const likes = await service.getAllLikesFromUser(userId, authorId as string);

    return res.status(HttpStatus.OK).json(likes);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /reaction/retweets:
 *   get:
 *     summary: Get All Retweets from a User
 *     description: Retrieves all retweets made by a specific user (author). Requires authentication. The requesting user must be following the author or the author's profile must be public.
 *     tags:
 *       - Reactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: authorId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the user (author) whose retweets you want to retrieve.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ReactionDTO'
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
 *         description: No reactions found for this user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find reactions"
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
reactionRouter.get('/retweets', async (req: Request, res: Response, next: NextFunction) => {
  const { authorId } = req.query;
  const { userId } = res.locals.context;

  try {
    const retweets = await service.getAllRetweetsFromUser(userId, authorId as string);

    return res.status(HttpStatus.OK).json(retweets);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /reaction/{post_id}:
 *   post:
 *     summary: Create a New Reaction
 *     description: Creates a new reaction (like or dislike) on a post. Requires authentication.
 *     tags:
 *       - Reactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: post_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the post to react to.
 *     requestBody:
 *       description: Reaction details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReactionActionDTO'
 *     responses:
 *       200:
 *         description: Reaction created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ReactionDTO'
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
 *         description: Post or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find post not found"
 *                 code:
 *                   type: integer
 *       409:
 *         description: Conflict. The reaction already exists.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Conflict"
 *                 code:
 *                   type: integer
 *                 error_code:
 *                   type: string
 *                   example: "reaction already Exists"
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
reactionRouter.post(
  '/:post_id',
  BodyValidation(ReactionActionDTO),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = res.locals.context;
    const data: ReactionActionDTO = req.body;
    const { post_id: postId } = req.params;

    try {
      const reaction = await service.createReaction(new CreateReactionDTO(userId, postId, data));

      return res.status(HttpStatus.OK).json(reaction);
    } catch (e) {
      next(e);
    }
  }
);

/**
 * @openapi
 * /reaction/{post_id}:
 *   delete:
 *     summary: Delete a Reaction
 *     description: Deletes a reaction (like or dislike) from a post by the authenticated user.
 *     tags:
 *       - Reactions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: post_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the post to delete the reaction from.
 *     requestBody:
 *       description: Reaction action to delete
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ReactionActionDTO'
 *     responses:
 *       200:
 *         description: Reaction deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Deleted reaction from 123e4567-e89b-12d3-a456-426614174000"
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
 *         description: Post or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find post not found"
 *                 code:
 *                   type: integer
 *       409:
 *         description: Conflict. The reaction does not exist.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Conflict"
 *                 code:
 *                   type: integer
 *                 error_code:
 *                   type: string
 *                   example: "reaction does not Exists"
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
reactionRouter.delete(
  '/:post_id',
  BodyValidation(ReactionActionDTO),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = res.locals.context;
    const data = req.body;

    const { post_id: postId } = req.params;

    try {
      await service.deleteReaction(new DeleteReactionDTO(userId, postId, data.action));

      return res.status(HttpStatus.OK).json({ message: `Deleted reaction from ${postId}` });
    } catch (e) {
      next(e);
    }
  }
);
