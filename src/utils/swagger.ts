import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { Constants, NodeEnv } from '@utils/constants';
import { Express, Request, Response } from 'express';

const servers =
  Constants.NODE_ENV === NodeEnv.DEV ? [{ url: 'http://localhost:8080/api' }] : [{ url: Constants.DEPLOY_URL }];

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Twitter backend API challenge',
      version: '1.0.0',
      description: 'Twitter backend challenge API made with Express, Node.js, and prisma',
    },
    components: {
      securitySchemes: {
        bearerAuth: {
          in: 'header',
          name: 'Authorization',
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
    servers,
  },
  apis: ['./src/domains/**/**/*.controller.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);

export function setupSwagger(app: Express): void {
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('/docs.json', (req: Request, res: Response) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });
}
