import { Request, Response } from 'express';
import { Redis } from 'ioredis';
import { createUpdootLoader, createUserLoader } from './utils';

export type MyContext = {
  redis: Redis;
  req: Request & { session: Express.Session };
  res: Response;
  updootLoader: ReturnType<typeof createUpdootLoader>;
  userLoader: ReturnType<typeof createUserLoader>;
};
