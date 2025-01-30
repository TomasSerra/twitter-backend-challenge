import { NextFunction, Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors';

import { BodyValidation, db, generatePreSignedUrl } from '@utils';

import { UserRepositoryImpl } from '../repository';
import { UserService, UserServiceImpl } from '../service';
import { UserUpdateInputDTO, UserViewDTO } from '@domains/user/dto';

export const userRouter = Router();

// Use dependency injection
const service: UserService = new UserServiceImpl(new UserRepositoryImpl(db));
/**
 * @openapi
 * components:
 *   schemas:
 *     UserDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *           description: Unique identifier of the user.
 *         name:
 *           type: string
 *           example: "John"
 *           description: Display name of the user (can be null).
 *         visibility:
 *           type: string
 *           enum: [PUBLIC, PRIVATE, FRIENDS]
 *           example: "PUBLIC"
 *           description: Privacy setting for the user's profile.
 *         profilePicture:
 *           type: string
 *           example: "AWS Presigned URL"
 *           description: AWS Presigned URL for the user's profile picture (can be null).
 *         createdAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-31T23:59:59.999Z"
 *           description: Date and time when the user was created.
 *         updatedAt:
 *           type: string
 *           format: date-time
 *           example: "2023-12-31T23:59:59.999Z"
 *           description: Date and time when the user was last updated.
 *
 *     UserUpdateInputDTO:
 *       type: object
 *       properties:
 *         visibility:
 *           type: string
 *           enum: [PUBLIC, PRIVATE, FRIENDS]
 *           example: "PRIVATE"
 *           description: (Optional) Updated privacy setting for the user's profile.
 *         name:
 *           type: string
 *           example: "John Doe"
 *           description: (Optional) Updated display name of the user.
 *         password:
 *           type: string
 *           example: "********"
 *           description: (Optional) Updated password for the user (will be hashed and stored securely).
 *         profilePicture:
 *           type: string
 *           example: "AWS Presigned URL"
 *           description: (Optional) Updated AWS Presigned URL for the user's profile picture.
 *
 *     UserUpdateOutputDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *           description: (Optional) Unique identifier of the user (typically included in responses).
 *         visibility:
 *           type: string
 *           enum: [PUBLIC, PRIVATE, FRIENDS]
 *           example: "PRIVATE"
 *           description: (Optional) Updated privacy setting for the user's profile.
 *         profilePicture:
 *           type: string
 *           example: "AWS Presigned URL"
 *           description: (Optional) Updated AWS Presigned URL for the user's profile picture.
 *         name:
 *           type: string
 *           example: "John Doe"
 *           description: (Optional) Updated display name of the user.
 *         passwordIsUpdated:
 *           type: boolean
 *           example: true
 *           description: (Optional) Indicates whether the password was updated.
 *
 *     ExtendedUserDTO:
 *       allOf:
 *         - $ref: '#/components/schemas/UserDTO'
 *         - type: object
 *           properties:
 *             email:
 *               type: string
 *               example: "johndoe@example.com"
 *               description: Email address of the user.
 *             username:
 *               type: string
 *               example: "johndoe123"
 *               description: Unique username of the user.
 *             password:
 *               type: string
 *               example: "********"
 *               description: Hashed password of the user (usually not returned in responses).
 *     UserViewDTO:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           example: "1"
 *           description: Unique identifier of the user.
 *         name:
 *           type: string
 *           example: "John"
 *           description: Display name of the user (can be null).
 *         username:
 *           type: string
 *           example: "username"
 *           description: Unique username of the user.
 *         profilePicture:
 *           type: string
 *           example: "AWS Presigned URL"
 *           description: AWS Presigned URL for the user's profile picture (can be null).
 *
 */

/**
 * @openapi
 * paths:
 *   /user:
 *     get:
 *       summary: Get User Recommendations
 *       description: |
 *         Retrieves a paginated list of recommended users for a given user. Requires authentication.
 *       tags:
 *         - Users
 *       security:
 *         - bearerAuth: []
 *       parameters:
 *         - in: query
 *           name: limit
 *           schema:
 *             type: integer
 *             minimum: 1
 *             default: 10
 *           description: The maximum number of users to return per page.
 *         - in: query
 *           name: skip
 *           schema:
 *             type: integer
 *             minimum: 0
 *             default: 0
 *           description: The number of users to skip (for pagination).
 *       responses:
 *         200:
 *           description: Successful operation
 *           content:
 *             application/json:
 *               schema:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                     example: "User Recommendations"
 *                   users:
 *                     type: array
 *                     items:
 *                       $ref: '#/components/schemas/UserViewDTO'
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
 *         404:
 *           description: No users found
 */
userRouter.get('/', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;
  const { limit, skip } = req.query as Record<string, string>;

  try {
    const users = await service.getUserRecommendations(userId, { limit: Number(limit), skip: Number(skip) });

    return res.status(HttpStatus.OK).json({ message: 'user Recomendations', users });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /user/me:
 *   get:
 *     summary: Get Current User Profile
 *     description: Retrieves the profile information of the currently authenticated user, including a pre-signed URL for the profile picture if available.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/UserViewDTO'
 *                 url:
 *                   type: string
 *                   description: Pre-signed URL for the user's profile picture (if it exists).
 *                   nullable: true
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
 *         description: Returns an error if the logged user was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found."
 */
userRouter.get('/me', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;

  try {
    const user = await service.getUser(userId);

    let url: string = '';
    if (user.profilePicture) {
      const preSignedUrl = await generatePreSignedUrl(user.profilePicture);
      url = preSignedUrl.signedUrl;
    }

    return res.status(HttpStatus.OK).json({
      user,
      url,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /user/{userId}:
 *   get:
 *     summary: Get User Profile
 *     description: Retrieves a user profile by ID, along with whether the currently authenticated user is following them.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the user whose profile you want to fetch.
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isFollowing:
 *                   type: boolean
 *                   description: Indicates whether the currently authenticated user is following the requested user.
 *                 user:
 *                   $ref: '#/components/schemas/UserViewDTO'
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
 *         description: Returns an error if the logged user was not found.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User not found."
 */
userRouter.get('/:userId', async (req: Request, res: Response, next: NextFunction) => {
  const { userId: otherUserId } = req.params;
  const { userId } = res.locals.context;

  try {
    const isPublic: boolean = await service.isUserPublic(otherUserId);
    const isFollowing: boolean = await service.isUserFollowed(userId, otherUserId);
    if (!isPublic && !isFollowing) {
      return res.status(HttpStatus.UNAUTHORIZED).json({ message: 'Unauthorized' });
    }
    const user: UserViewDTO = await service.getUser(otherUserId);

    return res.status(HttpStatus.OK).json({
      isPublic,
      isFollowing,
      user,
    });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /user/by_username/{username}:
 *   get:
 *     summary: Get Users by Username
 *     description: Retrieves a list of user profiles whose usernames contain the provided search string.
 *     tags:
 *       - Users
 *     parameters:
 *       - in: path
 *         name: username
 *         schema:
 *           type: string
 *         required: true
 *         description: The search string to match against usernames.
 *     responses:
 *       200:
 *         description: Successful operation.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/UserViewDTO'
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
 */
userRouter.get('/by_username/:username', async (req: Request, res: Response, next: NextFunction) => {
  const { username } = req.params;

  try {
    const users: UserViewDTO[] = await service.getUsersContainsUsername(username);

    return res.status(HttpStatus.OK).json(users);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 *
 * /user/:
 *   delete:
 *     summary: Delete current user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: User deleted successfully.
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
 */
userRouter.delete('/', async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals.context;

  try {
    await service.deleteUser(userId);

    return res.status(HttpStatus.NO_CONTENT);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /user/update:
 *   put:
 *     summary: Update User Profile
 *     description: Updates the profile information of the currently authenticated user.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: User update details
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UserUpdateInputDTO'
 *     responses:
 *       200:
 *         description: Successful operation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "User updated successfully"
 *                 user:
 *                   $ref: '#/components/schemas/UserDTO'
 *                 url:
 *                   type: string
 *                   nullable: true
 *                   description: Pre-signed URL for the updated profile picture (if applicable).
 *       204:
 *         description: User successfully made private.
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
 */
userRouter.put(
  '/update',
  BodyValidation(UserUpdateInputDTO),
  async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = res.locals.context;
    const { name, password, visibility, profilePicture } = req.body;

    try {
      let url: string = '';
      const user = await service.updateUser(userId, { name, password, visibility, profilePicture });
      if (user?.profilePicture) {
        const preSignedUrl = await generatePreSignedUrl(user.profilePicture);
        url = preSignedUrl.signedUrl;
      }

      res.status(HttpStatus.OK).send({
        message: 'User updated successfully',
        user,
        url,
      });
    } catch (e) {
      next(e);
    }
  }
);
