# Deployment Documentation

## Frontend Deployment

### Vercel (Recommended)

1. **Build the frontend:**

```bash
cd packages/frontend
npm run build
```

2. **Deploy to Vercel:**

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (from project root)
cd packages/frontend
vercel --prod
```

### Netlify

1. **Build:**

```bash
cd packages/frontend
npm run build
```

2. **Deploy:**

- Drag and drop the `dist/` folder to netlify.com
- Or use Netlify CLI: `netlify deploy --prod --dir=dist`

### Environment Variables for Frontend

Set these in your hosting platform:

- `VITE_API_BASE_URL=https://your-backend-api-url.com`

---

## Backend Deployment

### Heroku

1. **Create Heroku app:**

```bash
# Install Heroku CLI
brew install heroku/brew/heroku  # macOS

# Login and create app
heroku login
heroku create your-app-name

# Add buildpack for monorepo
heroku buildpacks:set https://github.com/lstoll/heroku-buildpack-monorepo
heroku config:set APP_BASE=packages/backend
```

2. **Configure package.json for Heroku:**
   Add to `packages/backend/package.json`:

```json
{
  "scripts": {
    "heroku-postbuild": "npm run build",
    "start": "node dist/index.js"
  }
}
```

3. **Deploy:**

```bash
git push heroku main
```

### Railway

1. **Connect repository to Railway**
2. **Set build command:** `cd packages/backend && npm install && npm run build`
3. **Set start command:** `cd packages/backend && npm start`
4. **Set environment variables**

### Environment Variables for Backend

Set these in your hosting platform:

- `NODE_ENV=production`
- `PORT=3001` (or let the platform set it)
- `FRONTEND_URL=https://your-frontend-url.com`

---

## Docker Deployment

### Option A: Separate Containers

Build and deploy frontend and backend in separate containers.

### Option B: Multi-stage Build

Use a single Dockerfile with multi-stage builds for both services.

---

## CI/CD Pipeline

Set up GitHub Actions for automated deployment on every push to main branch.

---

## Database Integration

For production, you'll want to:

1. Replace the in-memory user array with a real database
2. Use PostgreSQL, MongoDB, or other database services
3. Set up database connection and migrations
