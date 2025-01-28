import { NextFunction, Request, Response } from 'express';
import HttpStatus from 'http-status';
import { Logger } from '@utils';

/**
 * @openapi
 * components:
 *   schemas:
 *     HttpException:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *           description: A human-readable error message.
 *         code:
 *           type: integer
 *           description: The HTTP status code associated with the error.
 *         errors:
 *           type: array
 *           items:
 *             type: object
 *           description: (Optional) An array of additional error details.

 *     UnauthorizedException:
 *       allOf:
 *         - $ref: '#/components/schemas/HttpException'
 *         - type: object
 *           properties:
 *             error_code:
 *               type: string
 *               description: (Optional) A specific error code for the unauthorized exception.

 *     ValidationException:
 *       allOf:
 *         - $ref: '#/components/schemas/HttpException'
 *         - type: object
 *           properties:
 *             errors:
 *               type: array
 *               items:
 *                 type: object
 *               description: An array of validation error details.
 *
 *     ForbiddenException:
 *       allOf:
 *         - $ref: '#/components/schemas/HttpException'
 *
 *     InvalidUserException:
 *       allOf:
 *         - $ref: '#/components/schemas/HttpException'

 *     NotFoundException:
 *       allOf:
 *         - $ref: '#/components/schemas/HttpException'

 *     ConflictException:
 *       allOf:
 *         - $ref: '#/components/schemas/HttpException'
 *         - type: object
 *           properties:
 *             error_code:
 *               type: string
 *               description: (Optional) A specific error code for the conflict exception.
 */

abstract class HttpException extends Error {
  constructor(readonly code: number, readonly message: string, readonly error?: object[] | object) {
    super(message);
  }
}

export class UnauthorizedException extends HttpException {
  constructor(errorCode?: string) {
    super(HttpStatus.UNAUTHORIZED, 'Unauthorized. You must login to access this content.', { error_code: errorCode });
  }
}

export class ValidationException extends HttpException {
  constructor(errors: object[]) {
    super(HttpStatus.BAD_REQUEST, 'Validation Error', errors);
  }
}

export class ForbiddenException extends HttpException {
  constructor() {
    super(HttpStatus.FORBIDDEN, 'Forbidden. You are not allowed to perform this action');
  }
}

export class InvalidUserException extends HttpException {
  constructor() {
    super(HttpStatus.NOT_FOUND, "You don't have permission to perform this action on user");
  }
}

export class NotFoundException extends HttpException {
  constructor(model?: string) {
    super(HttpStatus.NOT_FOUND, `Not found.${model ? " Couldn't find " + model : ''}`);
  }
}

export class ConflictException extends HttpException {
  constructor(errorCode?: string) {
    super(HttpStatus.CONFLICT, 'Conflict', { error_code: errorCode });
  }
}

export function ErrorHandling(error: Error, req: Request, res: Response, next: NextFunction): Response {
  if (error===null || error===undefined) next(); // TODO How should I fix EsLint here?
  if (error instanceof HttpException) {
    if (error.code === HttpStatus.INTERNAL_SERVER_ERROR) {
      Logger.error(error.message);
    }
    return res.status(error.code).json({ message: error.message, code: error.code, errors: error.error });
  }
  Logger.error(error.message);
  return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ message: error.message, code: 500 });
}
