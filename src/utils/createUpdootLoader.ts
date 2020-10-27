import DataLoader from 'dataloader';
import { Updoot } from '../entities/Updoot';

export const createUpdootLoader = () =>
  new DataLoader<{ postId: string; userId: string }, Updoot | null>(
    async (keys) => {
      const updoots = await Updoot.findByIds(keys as any);

      const updootsIdsToUpdoot: Record<string, Updoot> = {};

      updoots.forEach((u) => {
        updootsIdsToUpdoot[`${u.userId}|${u.postId}`] = u;
      });

      return keys.map(
        (key) => updootsIdsToUpdoot[`${key.userId}|${key.postId}`],
      );
    },
  );
