import {
  Arg,
  Ctx,
  Field,
  FieldResolver,
  Mutation,
  ObjectType,
  Query,
  Resolver,
  Root,
} from 'type-graphql';
import argon2 from 'argon2';
import { v4 } from 'uuid';

import { MyContext } from '../types';
import { User } from '../entities/User';
import { COOKIE_NAME, FORGET_PASSWORD_PREFIX } from '../constants';
import { UsernamePasswordInput } from './UsernamePasswordInput';
import {
  sendEmail,
  validateEmail,
  validatePassword,
  validateRegister,
  validationErrors,
} from '../utils';

@ObjectType()
class FieldError {
  @Field()
  field: string;

  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];

  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver(User)
export class UserResolver {
  @FieldResolver(() => String)
  email(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.email;
    }

    return '';
  }

  @FieldResolver(() => String)
  updatedAt(@Root() user: User, @Ctx() { req }: MyContext) {
    if (req.session.userId === user.id) {
      return user.updatedAt;
    }

    return '';
  }

  @Query(() => User, { nullable: true })
  me(@Ctx() { req }: MyContext) {
    if (!req.session.userId) {
      return null;
    }

    return User.findOne(req.session.userId);
  }

  @Mutation(() => UserResponse)
  async register(
    @Arg('options') options: UsernamePasswordInput,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    // TO ENABLE NEW SIGN UPS, REMOVE THIS
    return {
      user: undefined,
    };

    // AND UNCOMMENT THIS
    // const errors = validateRegister(options);
    // if (errors) {
    //   return { errors };
    // }

    // const hashedPassword = await argon2.hash(options.password);
    // let user;

    // try {
    //   user = await User.create({
    //     email: options.email.toLowerCase(),
    //     username: options.username,
    //     password: hashedPassword,
    //   }).save();

    //   req.session.userId = user?.id;
    // } catch (err) {
    //   if (err.code === '23505') {
    //     if (err.detail.includes('email')) {
    //       return {
    //         errors: [
    //           {
    //             field: 'email',
    //             message: 'email is not available',
    //           },
    //         ],
    //       };
    //     } else {
    //       return {
    //         errors: [
    //           {
    //             field: 'username',
    //             message: 'username is not available',
    //           },
    //         ],
    //       };
    //     }
    //   }
    // }

    // return { user };
  }

  @Mutation(() => UserResponse)
  async login(
    @Arg('usernameOrEmail') usernameOrEmail: string,
    @Arg('password') password: string,
    @Ctx() { req }: MyContext,
  ): Promise<UserResponse> {
    const user = await User.findOne(
      validateEmail(usernameOrEmail)
        ? { where: { email: usernameOrEmail.toLowerCase() } }
        : { where: { username: usernameOrEmail } },
    );
    if (!user) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    const valid = await argon2.verify(user.password, password);
    if (!valid) {
      return {
        errors: [
          {
            field: 'password',
            message: 'incorrect password',
          },
        ],
      };
    }

    req.session.userId = user.id;

    return { user };
  }

  @Mutation(() => Boolean)
  logout(@Ctx() { req, res }: MyContext): Promise<boolean> {
    return new Promise((resolve) =>
      req.session.destroy((err) => {
        res.clearCookie(COOKIE_NAME);
        if (err) {
          console.log(err);
          resolve(false);
          return;
        }

        resolve(true);
      }),
    );
  }

  @Mutation(() => Boolean)
  async forgotPassword(
    @Arg('email') email: string,
    @Ctx() { redis }: MyContext,
  ) {
    return false;
    // const parsedEmail = email.toLowerCase();
    // const user = await User.findOne({ where: { email: parsedEmail } });

    // if (!user) {
    //   return true;
    // }

    // const token = v4();

    // await redis.set(
    //   FORGET_PASSWORD_PREFIX + token,
    //   user.id,
    //   'ex',
    //   1000 * 60 * 60 * 24 * 3, // 3 days
    // );

    // await sendEmail(
    //   parsedEmail,
    //   'LiReddit - Forgot something?',
    //   `<a href="http://localhost:3000/reset-password/${token}">reset password</a>`, // this is not working (nodemailer test provider only)
    // );

    // return true;
  }

  @Mutation(() => UserResponse)
  async changePassword(
    @Arg('token') token: string,
    @Arg('newPassword') newPassword: string,
    @Ctx() { req, redis }: MyContext,
  ): Promise<UserResponse> {
    if (!validatePassword(newPassword)) {
      return { errors: [validationErrors.validateNewPassword] };
    }

    const redisKey = FORGET_PASSWORD_PREFIX + token;
    const userId = await redis.get(redisKey);

    if (!userId) {
      return { errors: [validationErrors.tokenExpired] };
    }

    const user = await User.findOne(userId);

    if (!user) {
      return { errors: [validationErrors.tokenUserNotFound] };
    }

    const hashedPassword = await argon2.hash(newPassword);
    await User.update({ id: userId }, { password: hashedPassword });

    await redis.del(redisKey);

    req.session.userId = user.id;

    return { user };
  }
}
