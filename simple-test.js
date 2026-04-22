const http = require('http');

console.log('Testing registration endpoint...\n');

const data = JSON.stringify({
  email: `test.${Date.now()}@example.com`,
  password: 'TestPass123!',
  firstName: 'Test',
  lastName: 'User',
  phoneNumber: '0211234567',
  cityRegion: 'Auckland',
  isClient: true,
  isProvider: false
});

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/auth/register',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = http.request(options, (res) => {
  console.log(`Status Code: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let body = '';
  res.on('data', (chunk) => {
    body += chunk;
  });
  
  res.on('end', () => {
    console.log('\nResponse Body:', body);
    try {
      const json = JSON.parse(body);
      console.log('\nParsed JSON:', JSON.stringify(json, null, 2));
    } catch (e) {
      console.log('Response is not JSON');
    }
  });
});

req.on('error', (e) => {
  console.error('Request error:', e.message);
});

req.write(data);
req.end();