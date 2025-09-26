import { router } from '../trpc/trpc';
import { pixelRouter } from './pixel';
import { userRouter } from './user';

export const appRouter = router({
  pixel: pixelRouter,
  user: userRouter,
});

export type AppRouter = typeof appRouter;