# Knee Rehab Program - API (Backend)

NestJS backend for the Knee Rehab Program system.

## Setup Instructions

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env` file in the root directory:
   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/knee_rehab
   JWT_SECRET=your_jwt_secret
   PORT=3001
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:3002
   ALLOWED_ADMIN_DOMAIN=krps.com
   ```

3. Run the development server:
   ```bash
   npm run start:dev
   ```

## Production Deployment (Render)
- Use **Web Service**.
- Build Command: `npm install && npm run build`
- Start Command: `npm run start:prod`
- Make sure to set `DATABASE_URL` (Internal URL from Render Postgres), `JWT_SECRET`, and `ALLOWED_ORIGINS` in Environment Variables.

## API Documentation
Once the server is running, visit `http://localhost:3001/api` for the Swagger UI documentation.
