async function check() {
  try {
    const res = await fetch('https://pdf-compress-backend.onrender.com/api/auth/request-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'support.pdfcompresspro@gmail.com', password: 'wrong' })
    });
    const text = await res.text();
    console.log('STATUS:', res.status, 'BODY:', text.slice(0, 150));
  } catch (err) {
    console.error('Fetch error:', err.message);
  }
}
check();
