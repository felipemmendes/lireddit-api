# LiReddit API

This is the code for LiReddit API. To see the code for LiReddit Web, [click here ](https://github.com/felipemmendes/lireddit-web).

## See live at: https://lireddit.fmmendes.com

LiReddit is a Reddit-like website created following [Ben Awad's tutorial](https://www.youtube.com/watch?v=I6ypD7qv3Z8).

<br/>

## LiReddit pages and features:

- Home page with posts list;
- Post page
- Register page\*;
- Login page\*\*;
- Forgot password\*;
- Create and edit posts;
- Cookie Authentication;
- Voting system;

<sub>\* I've decidet to disable Register and Forgot Password features for now, as the live site is just an example and I don't wanna deal with issues like moderating user content.</sub>

<sub>\*\*You can sign in as a Demo user to see pages that need authentication, but it has restricted permissions (cannot create, edit or delete posts). Note that, if you do this, a session cookie will be created. You can remove it directly in your browser or just by logging out.</sub>

<br />

### Demo User:

username: lurker  
password: lurker

<br />

## Technologies

### Server

- Node.js with TypeScript
- TypeORM (migrated from MikroORM)
- PostgreSQL and Redis
- GraphQL with TypeGraphQL
- Express with Apollo

### Web

- React with TypeScript
- Next.js
- Chakra
- GraphQL with Apollo (migrated from URQL)
