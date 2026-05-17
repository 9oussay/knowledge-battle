# Knowledge Battle Royale

Next.js app for competitive learning duels (programming + networking), with AI judging and progression.

## Auth + Prisma setup

Create a `.env` file:

```env
DATABASE_URL="mongodb+srv://USER:PASSWORD@HOST/knowledge-battle?retryWrites=true&w=majority"
JWT_SECRET="replace-with-a-long-random-secret"
```

Install dependencies:

```bash
npm install
```

Generate Prisma client and push schema:

```bash
npm run prisma:generate
npm run prisma:push
```

Run the app:

```bash
npm run dev
```

## Implemented endpoints

- `POST /api/auth/register`
- `POST /api/auth/login`

## Implemented pages

- `/register`
- `/login`
