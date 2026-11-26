# E-Commerce REST API (Dockerized, Tested, CI-Ready)

A backend API for an online store, featuring JWT authentication with role-based access control, a cached and searchable product catalog, and transactional order checkout. Built with Node.js, Express, TypeScript, PostgreSQL, Prisma and Redis, and packaged with Docker, automated tests and a GitHub Actions CI pipeline.

## Features

- **Authentication:** registration and login with bcrypt-hashed passwords and signed JWTs (15-minute expiry)
- **Role-based access control:** `USER` and `ADMIN` roles, with admin-only routes
- **Security:** Helmet security headers, CORS restricted to a trusted origin, and login rate limiting (5 attempts per 15 minutes) backed by Redis
- **Products:** paginated listing with case-insensitive name search; admin-only create, update and delete
- **Redis caching:** the product listing uses the Cache-Aside pattern with a 1-hour TTL, purged on every write
- **Orders:** checkout runs inside a single Prisma `$transaction` that validates products, deducts stock atomically and rolls back on failure
- **Docker:** multi-stage Dockerfile (non-root runtime user) and a Docker Compose stack for the API, PostgreSQL and Redis with health checks
- **Automated tests:** Jest and Supertest suites for middleware and routes
- **CI:** GitHub Actions runs the tests and the build on every pull request to `main`

## Tech Stack

| Layer           | Technology                             |
| --------------- | -------------------------------------- |
| Runtime         | Node.js 22                             |
| Framework       | Express 5                              |
| Language        | TypeScript                             |
| Database        | PostgreSQL 16                          |
| ORM             | Prisma (with `@prisma/adapter-pg`)     |
| Cache           | Redis 7                                |
| Auth & Security | jsonwebtoken, bcrypt, helmet, cors     |
| Rate limiting   | express-rate-limit + rate-limit-redis  |
| Testing         | Jest, Supertest, @swc/jest             |
| DevOps          | Docker, Docker Compose, GitHub Actions |

## Project Structure

```
.github/workflows/
  ci.yml               # CI pipeline (tests + build on pull requests)
prisma/
  schema.prisma        # Data models and relations
  migrations/          # SQL migrations
src/
  config/              # Redis client and connection
  controllers/         # Request validation and HTTP responses
  middleware/          # authenticateToken, authorizeRole, rate limiter
  routes/              # Route definitions
  services/            # Business logic, database access and caching
  app.ts               # Express app (middleware, routes, error handler)
  index.ts             # Server entry point
  prisma.ts            # Prisma client instance
tests/
  authMiddleware.test.ts
  userRoutes.test.ts
Dockerfile
docker-compose.yml
jest.config.js
```

The code follows a **Routes → Controllers → Services** separation of concerns. `app.ts` exports the app without starting the server, so tests can import it directly.

## API Endpoints

| Method | Endpoint                   | Access        | Description                                     |
| ------ | -------------------------- | ------------- | ----------------------------------------------- |
| POST   | `/api/auth/register`       | Public        | Create a new account                            |
| POST   | `/api/auth/login`          | Public        | Log in and receive a JWT (rate limited)         |
| GET    | `/api/auth/profile`        | Authenticated | Get the logged-in user's data                   |
| GET    | `/api/auth/admindashboard` | Admin         | Admin-only test route                           |
| GET    | `/api/products`            | Public        | List products (`?page=1&limit=10&search=shirt`) |
| POST   | `/api/products`            | Admin         | Create a product                                |
| PUT    | `/api/products/:id`        | Admin         | Update a product                                |
| DELETE | `/api/products/:id`        | Admin         | Delete a product                                |
| POST   | `/api/orders`              | Authenticated | Place an order                                  |

Protected routes expect the header `Authorization: Bearer <token>`.

## Getting Started with Docker (recommended)

### Prerequisites

- Docker Desktop

### Environment variables

Copy `.env.example` to `.env` and set at least these values:

| Variable            | Description                                         |
| ------------------- | --------------------------------------------------- |
| `JWT_SECRET`        | Secret used to sign JWTs (use a long random string) |
| `POSTGRES_PASSWORD` | Password for the PostgreSQL container               |

`DATABASE_URL` and `REDIS_URL` in `.env` are only used when running the API outside Docker. Inside Docker Compose they are built automatically from the service names.

### Run the whole stack

```bash
docker compose up --build
```

This starts four services in order:

1. `db` (PostgreSQL) and `redis`, each with a health check
2. `migrate`, a one-off job that applies the Prisma migrations once the database is healthy
3. `api`, which starts only after the database and Redis are healthy and the migrations have finished

The API is available at `http://localhost:3000`. PostgreSQL and Redis are not exposed to the host; only the API can reach them through the internal Docker network.

```bash
docker compose down        # stop the stack, keep the data
docker compose down -v     # stop the stack and delete the database volume
```

### Docker image

The `Dockerfile` is multi-stage:

- **builder:** installs all dependencies, generates the Prisma client and compiles TypeScript
- **runner:** installs production dependencies only, copies the compiled `dist/` folder and runs as the non-root `node` user

`.env` files are excluded from the image through `.dockerignore`.

## Running Locally (without Docker for the API)

Requires Node.js 22, a running PostgreSQL instance and a Redis instance.

```bash
npm install
npx prisma migrate dev
npx prisma generate
npm run dev
```

## Testing

```bash
npm test
```

The tests use Jest and Supertest. The database, Redis and the rate limiter are mocked, so the suite runs in seconds without any running services.

- `authMiddleware.test.ts`: missing token (401), invalid token (403), valid token (200), role checks for `USER` and `ADMIN`
- `userRoutes.test.ts`: register validation, duplicate email (409), password never returned, login success and failure, protected profile route

## Continuous Integration

`.github/workflows/ci.yml` runs on every pull request to `main`:

1. Check out the code and set up Node.js 22
2. `npm ci`
3. `npx prisma generate`
4. `npm test`
5. `npm run build`

With branch protection enabled on `main` (required status check: `test-and-build`), a pull request cannot be merged if any step fails.

## Scripts

| Script          | Description                    |
| --------------- | ------------------------------ |
| `npm run dev`   | Start the server in watch mode |
| `npm run build` | Compile TypeScript to `dist/`  |
| `npm start`     | Run the compiled build         |
| `npm test`      | Run the Jest test suites       |

## Roadmap

- Automated deployment to a cloud provider
- Event-driven order processing with a message broker
