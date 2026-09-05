const fs = require('fs');
const https = require('https');

const boundary = '----WebKitFormBoundaryTest12345';
const fileData = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64');

const pre = Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="logo"; filename="pixel.png"\r\nContent-Type: image/png\r\n\r\n`);
const post = Buffer.from(`\r\n--${boundary}--\r\n`);
const fullBody = Buffer.concat([pre, fileData, post]);

const req = https.request('https://pdf-compress-backend.onrender.com/api/admin/logo', {
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': fullBody.length,
    'Authorization': 'Bearer local-admin-token'
  }
}, res => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('STATUS:', res.statusCode);
    console.log('RESPONSE:', data);
  });
});

req.on('error', console.error);
req.write(fullBody);
req.end();
