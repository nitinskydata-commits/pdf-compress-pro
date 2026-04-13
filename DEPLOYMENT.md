# Deployment

## Run

```bash
npm install
npm start
```

The app serves both frontend and API from `http://localhost:5000`.

## Admin credentials

- Email: `admin@pdfcompresspro.com`
- Password: `Admin@123456`

Override with environment variables:

- `PORT`
- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_TOKEN`

## Notes

- App entrypoint: `pdf-compressor/backend/app.js`
- Persistent data file: `pdf-compressor/backend/data/db.json`
