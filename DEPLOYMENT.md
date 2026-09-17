# Deploy the portfolio: Vercel + Render

This is the recommended production setup:

```
Vercel (React / Vite frontend)  ->  Render (FastAPI API)  ->  Render Postgres
```

The frontend can display its bundled portfolio content without the API, but
the API and Postgres database are needed for the admin editor and for content
changes to persist.

## 1. Push the repository to GitHub

Create a private or public GitHub repository, then push this project. Do not
commit `.env` files, administrator passwords, API keys, or database URLs.

## 2. Create the Vercel project

1. In Vercel, import the GitHub repository.
2. Set **Root Directory** to `frontend` and select the Vite framework preset.
3. Keep the detected build command (`npm run build`) and output directory
   (`dist`).
4. Deploy once. Note the production address, for example
   `https://anirudh-portfolio.vercel.app`.

`frontend/vercel.json` is included so direct visits to `/admin` and individual
project URLs resolve correctly instead of returning a Vercel 404.

## 3. Create the Render Postgres database

1. In Render, create **Postgres** in the region you want to use.
2. Create a database named for this portfolio.
3. Keep it private and copy its **Internal Database URL** for the API service.

The backend accepts the standard Render `postgresql://` URL directly and
selects the secure psycopg 3 SQLAlchemy driver automatically.

## 4. Create the Render API service

1. Create a **Web Service** from the same repository.
2. Set **Root Directory** to `backend`.
3. Select the Docker runtime. Render will use the included `backend/Dockerfile`.
4. Set Health Check Path to `/api/health`.
5. Add these production environment variables:

| Name | Value |
| --- | --- |
| `ENVIRONMENT` | `production` |
| `DATABASE_URL` | The Render Postgres **Internal Database URL** |
| `SECRET_KEY` | A new random value of at least 32 characters |
| `ADMIN_USERNAME` | Your desired administrator username |
| `ADMIN_PASSWORD` | A unique, strong administrator password |
| `CORS_ORIGINS` | Your exact Vercel URL, e.g. `https://anirudh-portfolio.vercel.app` |
| `LLM_API_KEY` | Optional; only if you enable the LLM feature |

Do not use `*` for `CORS_ORIGINS`, and do not put a trailing slash on the
Vercel URL. The backend deliberately refuses an unsafe production CORS or
missing production secret configuration.

When the service finishes, copy its public URL, for example
`https://anirudh-portfolio-api.onrender.com`.

### Uploaded files

Admin-uploaded certificate images live in `UPLOAD_DIR`. If you will use that
feature, attach persistent storage to the Render service and set
`UPLOAD_DIR` to a directory on that storage. Without persistent storage,
those uploaded images can disappear on a redeploy; the Postgres content itself
will still persist.

## 5. Connect Vercel to the API

In Vercel Project Settings -> Environment Variables, add for the **Production**
environment:

```
VITE_API_URL=https://anirudh-portfolio-api.onrender.com
```

Replace the example with your actual Render service address, then redeploy the
Vercel project. `VITE_API_URL` is public browser configuration, so never put
secrets, passwords, database URLs, or API keys in it.

`VITE_API_TIMEOUT_MS=30000` is optional (and is already the application
default). It lets the non-blocking background content request wait for a
sleeping Render Free service while the portfolio renders its bundled fallback
immediately. Do not add any backend secret to Vercel.

## 6. Verify production

1. Open `https://YOUR_RENDER_URL/api/health` and confirm it reports healthy.
2. Open the Vercel site in an incognito/private window.
3. Test a direct project URL and `/admin` to confirm client-side routing.
4. Open the homepage in a second tab, then log in to `/admin`, change a
   harmless field, and save it. The already-open homepage updates without a
   browser refresh. A public tab in another browser/device verifies a tiny
   revision once per visible minute and updates only when that marker changes.
5. Confirm browser developer tools show no CORS errors.

After those checks, connect a custom domain in Vercel if desired and update
`CORS_ORIGINS` on Render to include that exact `https://` domain as well.
