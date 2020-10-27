import 'reflect-metadata';
import 'dotenv-safe/config';
import { createConnection } from 'typeorm';
import express from 'express';
import cors from 'cors';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import Redis from 'ioredis';
import session from 'express-session';
import connectRedis from 'connect-redis';
import path from 'path';

import { PostResolver } from './resolvers/post';
import { UserResolver } from './resolvers/user';
import { COOKIE_NAME, __prod__ } from './constants';
import { Post } from './entities/Post';
import { User } from './entities/User';
import { Updoot } from './entities/Updoot';
import { createUpdootLoader, createUserLoader } from './utils';

const main = async () => {
  const connection = await createConnection({
    type: 'postgres',
    url: process.env.DATABASE_URL,
    logging: true,
    entities: [Post, User, Updoot],
    migrations: [path.join(__dirname, 'migrations/*')],
  });

  await connection.runMigrations();

  const app = express();

  const RedisStore = connectRedis(session);
  const redis = new Redis(process.env.REDIS_URL);

  app.set('trust proxy', 1);

  app.use(
    cors({
      origin: process.env.CORS_ORIGIN,
      credentials: true,
    }),
  );

  app.use(
    session({
      name: COOKIE_NAME,
      store: new RedisStore({
        client: redis,
        disableTouch: true,
      }),
      cookie: {
        maxAge: 1000 * 60 * 60 * 24 * 365 * 10, // 10 years
        httpOnly: true,
        sameSite: 'lax', // csrf
        secure: __prod__, // cookie only works on https
        domain: __prod__ ? '.fmmendes.com' : undefined,
      },
      saveUninitialized: false,
      secret: process.env.SESSION_SECRET,
      resave: false,
    }),
  );

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [PostResolver, UserResolver],
      validate: false,
    }),
    context: ({ req, res }) => ({
      req,
      res,
      redis,
      updootLoader: createUpdootLoader(),
      userLoader: createUserLoader(),
    }),
  });

  apolloServer.applyMiddleware({ app, cors: false });

  app.listen(process.env.PORT, () => {
    console.log(`Server started on ${process.env.PORT}`);
  });
};

main().catch((err) => {
  console.error(err);
});
