const http = require('http');

async function testFull() {
  process.env.PORT = '5098';
  process.env.JWT_SECRET = 'secret-123';
  process.env.ADMIN_EMAIL = 'support.pdfcompresspro@gmail.com';
  process.env.ADMIN_PASSWORD = 'Admin@123456';

  const app = require('../pdf-compressor/backend/app.js');
  const server = http.createServer(app);
  await new Promise(r => server.listen(5098, r));

  try {
    console.log('1. Testing fake email rejection (admin@pdfcompresspro.com)...');
    const fakeRes = await fetch('http://localhost:5098/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'admin@pdfcompresspro.com', password: 'Admin@123456' })
    });
    console.log('Fake email status:', fakeRes.status);
    if (fakeRes.status === 401) {
      console.log('✓ PASS: admin@pdfcompresspro.com is rejected!');
    }

    console.log('\n2. Testing real email (support.pdfcompresspro@gmail.com)...');
    const realRes = await fetch('http://localhost:5098/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'support.pdfcompresspro@gmail.com', password: 'Admin@123456' })
    });
    const realData = await realRes.json();
    console.log('Real email status:', realRes.status, realData);

    // Read active OTP from settings file (persistent storage)
    const fs = require('../pdf-compressor/backend/node_modules/fs-extra');
    const settings = fs.readJsonSync('pdf-compressor/backend/data/settings.json');
    console.log('Active OTP record in settings.json:', settings.activeOtp ? 'EXISTS (email: ' + settings.activeOtp.email + ')' : 'NONE');

    // We also know the OTP hash was stored
    // Let's test verify with the OTP generated
    // Let's create a known OTP in activeOtp to verify verify-otp
    const bcrypt = require('../pdf-compressor/backend/node_modules/bcryptjs');
    const testOtpCode = '777888';
    settings.activeOtp = {
      email: 'support.pdfcompresspro@gmail.com',
      otpHash: await bcrypt.hash(testOtpCode, 10),
      expiresAt: Date.now() + 15 * 60 * 1000,
      attempts: 0
    };
    fs.outputJsonSync('pdf-compressor/backend/data/settings.json', settings);

    console.log('\n3. Testing verify-otp with code 777888...');
    const verifyRes = await fetch('http://localhost:5098/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'support.pdfcompresspro@gmail.com', otp: '777888' })
    });
    const verifyData = await verifyRes.json();
    console.log('Verify status:', verifyRes.status, verifyData);
    if (verifyRes.status === 200 && verifyData.token) {
      console.log('✓ PASS: verify-otp successfully authenticated and returned JWT token!');
    } else {
      console.error('❌ FAIL: verify-otp failed');
    }

  } finally {
    server.close();
  }
}

testFull().catch(console.error);
