import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  InputType,
  Int,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
  UseMiddleware,
} from 'type-graphql';

import { isAuth } from '../middlewares/isAuth';
import { MyContext } from '../types';
import { Post } from '../entities/Post';
import { User } from '../entities/User';
import { getManager, LessThan } from 'typeorm';
import { Updoot } from '../entities/Updoot';

@InputType()
class PostInput {
  @Field()
  title: string;

  @Field()
  text: string;
}

@ObjectType()
class PaginatedPosts {
  @Field(() => [Post])
  posts: Post[];

  @Field()
  hasMore: boolean;
}

@Resolver(Post)
export class PostResolver {
  @FieldResolver(() => String)
  textSnippet(@Root() root: Post) {
    const slicedText =
      root.text.length > 50
        ? root.text.slice(0, 50) + '...'
        : root.text.slice(0, 50);
    return slicedText;
  }

  @FieldResolver(() => User, { nullable: true })
  creator(@Root() post: Post, @Ctx() { userLoader }: MyContext) {
    if (!post.creatorId) {
      return;
    }
    return userLoader.load(post.creatorId);
  }

  @FieldResolver(() => Int, { nullable: true })
  async voteStatus(
    @Root() post: Post,
    @Ctx() { updootLoader, req }: MyContext,
  ) {
    if (!req.session.userId) {
      return null;
    }

    const updoot = await updootLoader.load({
      postId: post.id,
      userId: req.session.userId,
    });

    return updoot ? updoot.value : null;
  }

  @Query(() => PaginatedPosts)
  async posts(
    @Arg('limit', () => Int) limit: number,
    @Arg('cursor', () => String, { nullable: true }) cursor: string | null,
  ): Promise<PaginatedPosts> {
    const realLimit = Math.min(50, limit);
    const realLimitPlusOne = Math.min(50, limit) + 1;

    const posts = await Post.find({
      where: cursor
        ? {
            createdAt: LessThan(new Date(parseInt(cursor))),
          }
        : {},
      order: {
        createdAt: 'DESC',
      },
      take: realLimitPlusOne,
    });

    return {
      posts: posts.slice(0, realLimit),
      hasMore: posts.length === realLimitPlusOne,
    };
  }

  @Query(() => Post, { nullable: true })
  post(@Arg('id') id: string): Promise<Post | undefined> {
    return Post.findOne(id);
  }

  @Mutation(() => Post, { nullable: true })
  @UseMiddleware(isAuth)
  createPost(
    @Arg('input') input: PostInput,
    @Ctx() { req }: MyContext,
  ): Promise<Post> | null {
    if (req.session.userId === process.env.DEMO_USER) {
      return null;
    }
    return Post.create({
      ...input,
      creatorId: req.session.userId,
    }).save();
  }

  @Mutation(() => Post)
  @UseMiddleware(isAuth)
  async updatePost(
    @Arg('id') id: string,
    @Arg('title') title: string,
    @Arg('text') text: string,
    @Ctx() { req }: MyContext,
  ): Promise<Post | null> {
    const post = await getManager()
      .createQueryBuilder()
      .update(Post)
      .set({ title, text })
      .where('id = :id and "creatorId" = :creatorId', {
        id,
        creatorId: req.session.userId,
      })
      .returning('*')
      .execute()
      .then((response) => response.raw[0]);

    return post;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async deletePost(
    @Arg('id') id: string,
    @Ctx() { req }: MyContext,
  ): Promise<boolean> {
    const post = await Post.findOne(id);

    if (!post) {
      return false;
    }

    if (post.creatorId !== req.session.userId) {
      throw new Error('not authorized');
    }

    await Post.delete({
      id,
      creatorId: req.session.userId,
    });
    return true;
  }

  @Mutation(() => Boolean)
  @UseMiddleware(isAuth)
  async vote(
    @Arg('postId', () => String) postId: string,
    @Arg('value', () => Int) value: number,
    @Ctx() { req }: MyContext,
  ) {
    const isUpdoot = value > 0;
    const realValue = isUpdoot ? 1 : -1;
    const { userId } = req.session;

    const updoot = await Updoot.findOne({ where: { postId, userId } });

    if (updoot && updoot.value !== realValue) {
      await getManager().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.update(
          Updoot,
          {
            postId,
            userId,
          },
          {
            value: realValue,
          },
        );
        await transactionalEntityManager.update(
          Post,
          { id: postId },
          { points: () => `points + ${2 * realValue}` },
        );
      });
    } else if (updoot && updoot.value === realValue) {
      await getManager().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.delete(Updoot, {
          postId,
          userId,
        });
        await transactionalEntityManager.update(
          Post,
          { id: postId },
          { points: () => `points + ${-1 * realValue}` },
        );
      });
    } else if (!updoot) {
      await getManager().transaction(async (transactionalEntityManager) => {
        await transactionalEntityManager.insert(Updoot, {
          userId,
          postId,
          value: realValue,
        });
        await transactionalEntityManager.update(
          Post,
          { id: postId },
          { points: () => `points + ${realValue}` },
        );
      });
    }

    return true;
  }
}
