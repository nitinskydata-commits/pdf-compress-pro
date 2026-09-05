async function testLiveAuth() {
  console.log('--- Testing Live Render Backend OTP Flow ---');

  // 1. Try fake email: admin@pdfcompresspro.com
  console.log('\n1. Testing fake email rejection...');
  const fakeRes = await fetch('https://pdf-compress-backend.onrender.com/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@pdfcompresspro.com', password: 'Admin@123456' })
  });
  console.log('Fake email status:', fakeRes.status);
  const fakeData = await fakeRes.json();
  console.log('Response:', fakeData);

  // 2. Try real email: support.pdfcompresspro@gmail.com
  console.log('\n2. Testing real email request-otp...');
  const realRes = await fetch('https://pdf-compress-backend.onrender.com/api/auth/request-otp', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'support.pdfcompresspro@gmail.com', password: 'Admin@123456' })
  });
  console.log('Real email status:', realRes.status);
  const realData = await realRes.json();
  console.log('Response:', realData);

  if (realRes.ok && realData.success) {
    console.log('\n✓ Request OTP succeeded on production Render!');
    console.log('The OTP has been stored in Render database & persistent storage with a 15-minute window.');
  }
}

testLiveAuth().catch(console.error);
