import { NextFunction, Request, Response, Router } from 'express';

import 'express-async-errors';
import { db } from '@utils';
import { FollowerRepositoryImpl } from '../repository';

import { FollowerService, FollowerServiceImpl } from '../service';
import { FollowerDTO } from '../dto';
import HttpStatus from 'http-status';

export const followerRouter: Router = Router();



// here we are applying dependency injection
const service: FollowerService = new FollowerServiceImpl(new FollowerRepositoryImpl(db));

/**
 * @openapi
 * components:
 *   schemas:
 *     CreateFollowDTO:
 *       type: object
 *       properties:
 *         followedId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user being followed.
 *         followerId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user initiating the follow.
 *
 *     FollowerDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier of the follow relationship.
 *         followedId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user being followed.
 *         followerId:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user initiating the follow.
 *         createdAt:
 *           type: string
 *           format: date-time
 *           description: The date and time the follow relationship was created.
 *
 *     GetFollowDTO:
 *       type: object
 *       properties:
 *         follower:
 *           type: string
 *           format: uuid
 *           description: The UUID of the follower (user initiating the follow).
 *         follow:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user being followed.
 *
 *     DeleteFollowDTO:
 *       type: object
 *       properties:
 *         follower:
 *           type: string
 *           format: uuid
 *           description: The UUID of the follower (user initiating the unfollow).
 *         follow:
 *           type: string
 *           format: uuid
 *           description: The UUID of the user being unfollowed.
 */


/**
 * @openapi
 * /follower/follow/{user_id}:
 *   post:
 *     summary: Follow a User
 *     description: Creates a follow relationship between the authenticated user and the specified user.
 *     tags:
 *       - Followers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the user to follow.
 *     responses:
 *       201:
 *         description: Follow relationship created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "user123 Following user456"
 *                 follow:
 *                   $ref: '#/components/schemas/FollowerDTO'
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
 *         description: Followed user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find followed does not exists"
 *                 code:
 *                   type: integer
 *       409:
 *         description: Conflict. Cannot follow oneself or follow relationship already exists
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
 *                   example: "cannot follow itself"
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
followerRouter.post('/follow/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  const followerId: string = res.locals.context.userId;
  const followedId: string = req.params.user_id;

  try {
    const follow: FollowerDTO = await service.createFollower(followerId, followedId);

    console.log(`${followerId} wants to follow ${followedId}`);

    return res.status(HttpStatus.CREATED).json({
      message: `${followerId} Following ${followedId}`,
      follow,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /follower/:
 *   get:
 *     summary: Get All Follows
 *     description: Retrieves a list of all follow relationships in the system.
 *     tags:
 *       - Followers
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/FollowerDTO'
 *       404:
 *         description: No follows found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find follows"
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
followerRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    return res.status(HttpStatus.OK).json(await service.getAllFollows());
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /follower/unfollow/{user_id}:
 *   post:
 *     summary: Unfollow a User
 *     description: Deletes the follow relationship between the authenticated user and the specified user.
 *     tags:
 *       - Followers
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: user_id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The ID of the user to unfollow.
 *     responses:
 *       200:
 *         description: Unfollow successful
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: "user123 unfollowed (deleted) Follower user456"
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
 *         description: Follow relationship not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not found. Couldn't find follow"
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
followerRouter.post('/unfollow/:user_id', async (req: Request, res: Response, next: NextFunction) => {
  const followerId: string = res.locals.context.userId;
  const followedId: string = req.params.user_id;

  try {
    console.log(`${followerId} wants to unfollow ${followedId}`);

    await service.deleteFollower(followerId, followedId);

    return res.status(HttpStatus.OK).send(`${followerId} unfollowed (deleted)  Follower ${followedId}`);
  } catch (e) {
    next(e);
  }
});
