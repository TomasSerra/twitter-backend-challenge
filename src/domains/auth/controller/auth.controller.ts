import { NextFunction, Request, Response, Router } from 'express';
import HttpStatus from 'http-status';
// express-async-errors is a module that handles async errors in express, don't forget import it in your new controllers
import 'express-async-errors';

import { BodyValidation, db } from '@utils';
import { UserRepositoryImpl } from '@domains/user/repository';

import { AuthService, AuthServiceImpl } from '../service';
import { LoginInputDTO, SignupInputDTO } from '../dto';

export const authRouter = Router();

// Use dependency injection
const service: AuthService = new AuthServiceImpl(new UserRepositoryImpl(db));

/**
 * @openapi
 *
 * /auth/signup:
 *   post:
 *     summary: Register a new user.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user (must follow valid email format).
 *                 example: "email@example.com"
 *               username:
 *                 type: string
 *                 description: The username of the new user.
 *                 example: "username"
 *               password:
 *                 type: string
 *                 description: The password of the user (minimum of 6 characters long, lower and upper case characters, 1+ number, and 1+ symbol).
 *                 example: "Password1234!"
 *     responses:
 *       201:
 *         description: Returns a JWT of the created User
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMDA3OWE4Yy1jMGIzLTRlNmYtYWVhYS0zNWNlNzA5NTY5M2UiLCJpYXQiOjE3MjI3OTA5NDMsImV4cCI6MTcyMjg3NzM0M30.I-39hZh5oaYVlSdJaDGRwt-C9JcDcTrAG60kXs9LS8k"
 *       409:
 *         description: Returns an error if already exists a user with provided email or username.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "USER_ALREADY_EXISTS"
 *       400:
 *         description: Returns a bad request error due to invalid username, email or password.
 */
authRouter.post('/signup', BodyValidation(SignupInputDTO), async (req: Request, res: Response, next: NextFunction) => {
  const data = req.body;

  try {
    const token = await service.signup(data);

    return res.status(HttpStatus.CREATED).json(token);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 *
 * /auth/login:
 *   post:
 *     summary: login a user.
 *     tags:
 *       - Authentication
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: The email of the user (must follow valid email format).
 *                 example: "email@example.com"
 *               username:
 *                 type: string
 *                 description: The username of the new user.
 *                 example: "username"
 *               password:
 *                 type: string
 *                 description: The password of the user (minimum of 6 characters long, lower and upper case characters, 1+ number, and 1+ symbol).
 *                 example: "Password1234!"
 *     responses:
 *       201:
 *         description: Returns a JWT of the logged user.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiIxMDA3OWE4Yy1jMGIzLTRlNmI3OTA5NDMsImV4cCI6MTcyMjg3NzM0M30"
 *       401:
 *         description: Returns an error if input password does not match with the user's password
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error_code:
 *                   type: string
 *                   example: "INCORRECT_PASSWORD"
 *       400:
 *         description: Returns a bad request error due to invalid username, email or password.
 */
authRouter.post('/login', BodyValidation(LoginInputDTO), async (req: Request, res: Response, next: NextFunction) => {
  const data = req.body;

  try {
    const token = await service.login(data);

    return res.status(HttpStatus.OK).json(token);
  } catch (e) {
    next(e);
  }
});
