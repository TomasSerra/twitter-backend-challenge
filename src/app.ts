import express from 'express';
import { Constants, ErrorHandling, NodeEnv } from '@utils';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import { router } from '@router';
import { setupSwagger } from '@utils/swagger';

export const app = express();


// Set up request logger
if (Constants.NODE_ENV === NodeEnv.DEV) {
  app.use(morgan('tiny')); // Log requests only in development environments
}

setupSwagger(app)

// Set up request parsers
app.use(express.json()); // Parses application/json payloads request bodies
app.use(express.urlencoded({ extended: false })); // Parse application/x-www-form-urlencoded request bodies
app.use(cookieParser()); // Parse cookies

// Set up CORS
app.use(
  cors({
    origin: Constants.CORS_WHITELIST,
  })
);

app.use('/api', router);

app.use(ErrorHandling);
