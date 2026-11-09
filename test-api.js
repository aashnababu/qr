const http = require('http');

async function runTests() {
  const server = require('./server.js');
  await new Promise((resolve) => setTimeout(resolve, 500));

  function request(path, options = {}) {
    return new Promise((resolve, reject) => {
      const req = http.request(
        `http://localhost:5000${path}`,
        {
          headers: { 'Content-Type': 'application/json' },
          ...options,
        },
        (res) => {
          let data = '';
          res.on('data', (chunk) => (data += chunk));
          res.on('end', () => {
            try {
              resolve({ status: res.statusCode, data: JSON.parse(data) });
            } catch (e) {
              resolve({ status: res.statusCode, raw: data });
            }
          });
        }
      );
      req.on('error', reject);
      if (options.body) {
        req.write(JSON.stringify(options.body));
      }
      req.end();
    });
  }

  try {
    console.log('\n--- 1. Testing GET /api/assistance/bed/:qrToken ---');
    const bedRes = await request('/api/assistance/bed/QR-ROOM101-BEDA');
    console.log('Status:', bedRes.status, 'Bed Found:', bedRes.data.data.roomNumber, bedRes.data.data.bedNumber);
    if (bedRes.status !== 200) throw new Error('Failed to fetch bed by QR');

    console.log('\n--- 2. Testing POST /api/assistance/request ---');
    const postRes = await request('/api/assistance/request', {
      method: 'POST',
      body: {
        bedId: bedRes.data.data.id,
        requestType: 'HELP_OUT_OF_BED',
        customNote: 'Needs physical support to wheelchair',
      },
    });
    console.log('Status:', postRes.status, 'Created Request ID:', postRes.data.data.id, 'Type:', postRes.data.data.requestType);
    if (postRes.status !== 201) throw new Error('Failed to create request');

    const createdId = postRes.data.data.id;

    console.log('\n--- 3. Testing GET /api/assistance/active ---');
    const activeRes = await request('/api/assistance/active');
    console.log('Status:', activeRes.status, 'Active count:', activeRes.data.count);
    if (activeRes.status !== 200 || activeRes.data.count < 1) throw new Error('Failed to fetch active requests');

    console.log('\n--- 4. Testing PATCH /api/assistance/request/:id/status (IN_PROGRESS) ---');
    const patchAck = await request(`/api/assistance/request/${createdId}/status`, {
      method: 'PATCH',
      body: { status: 'IN_PROGRESS' },
    });
    console.log('Status:', patchAck.status, 'New status:', patchAck.data.data.status, 'AcknowledgedAt:', patchAck.data.data.acknowledgedAt);
    if (patchAck.status !== 200 || !patchAck.data.data.acknowledgedAt) throw new Error('Failed acknowledging request');

    console.log('\n--- 5. Testing PATCH /api/assistance/request/:id/status (RESOLVED) ---');
    const patchRes = await request(`/api/assistance/request/${createdId}/status`, {
      method: 'PATCH',
      body: { status: 'RESOLVED' },
    });
    console.log('Status:', patchRes.status, 'New status:', patchRes.data.data.status, 'ResolvedAt:', patchRes.data.data.resolvedAt);
    if (patchRes.status !== 200 || !patchRes.data.data.resolvedAt) throw new Error('Failed resolving request');

    console.log('\n🎉 ALL BACKEND ENDPOINTS PASSED VERIFICATION!\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Test failed:', err);
    process.exit(1);
  }
}

runTests();

