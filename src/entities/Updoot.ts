import { BaseEntity, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { User } from './User';
import { Post } from './Post';

@Entity()
export class Updoot extends BaseEntity {
  @Column({ type: 'int' })
  value: number;

  @PrimaryColumn()
  userId!: string;

  @ManyToOne(() => User, (user) => user.updoots, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @PrimaryColumn()
  postId!: string;

  @ManyToOne(() => Post, (post) => post.updoots, {
    onDelete: 'CASCADE',
  })
  post!: Post;
}
