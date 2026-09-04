# Deployment Guide

## Architecture
- **Frontend**: Hosted on **Cloudflare Pages**
- **Backend API**: Hosted on **Render** (Docker Web Service with Ghostscript & QPDF)
- **Database**: **MongoDB Atlas**

---

## 1. Local Development

```bash
npm install
npm start
```
The app runs at `http://localhost:5000`.

---

## 2. Render Backend Deployment

1. Create a new **Web Service** on [Render](https://dashboard.render.com/).
2. Select your repository: `pdf-compress-pro`.
3. Set **Runtime** to `Docker` (automatically uses `./Dockerfile` with Ghostscript & QPDF).
4. Configure Environment Variables:
   - `NODE_ENV`: `production`
   - `PORT`: `8000`
   - `MONGODB_URI`: `mongodb+srv://...`
   - `JWT_SECRET`: `<your-random-jwt-secret>`
   - `SITE_URL`: `https://<your-cloudflare-subdomain>.pages.dev`
   - `ADMIN_EMAIL`: `admin@pdfcompresspro.com`
   - `ADMIN_PASSWORD`: `Admin@123456`

---

## 3. Prevent Free Tier Sleep (24/7 Uptime)

Render free tier spins down after 15 minutes of inactivity. To prevent this:
1. Register a free account at [UptimeRobot](https://uptimerobot.com/).
2. Add a new **HTTP(s)** monitor pointing to:
   `https://<your-render-service-name>.onrender.com/api/health`
3. Set the monitoring interval to **5 or 10 minutes**.
4. The service will stay awake 24/7 with zero cold start delays.

---

## 4. Cloudflare Pages Frontend Setup

Ensure `pdf-compressor/frontend/_redirects` routes `/api/*` to your Render service:
```nginx
/api/*      https://<your-render-service-name>.onrender.com/api/:splat  200
/admin/*    /admin/index.html                                           200
```

