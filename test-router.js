const router = require('./routes/assistance');
const { db } = require('./db');

function mockReq(params = {}, body = {}, query = {}) {
  return { params, body, query };
}

function mockRes() {
  const res = {
    statusCode: 200,
    data: null,
    status(code) {
      res.statusCode = code;
      return res;
    },
    json(obj) {
      res.data = obj;
      return res;
    },
  };
  return res;
}

// Find route handler in express router stack
function findHandler(method, pathPattern) {
  for (const layer of router.stack) {
    if (layer.route && layer.route.methods[method.toLowerCase()]) {
      if (layer.route.path === pathPattern) {
        return layer.route.stack[0].handle;
      }
    }
  }
  throw new Error(`Handler not found for ${method} ${pathPattern}`);
}

async function runUnitTests() {
  console.log('Testing Assistance API route handlers directly...\n');

  // Test 1: GET /bed/:qrToken
  const getBed = findHandler('get', '/bed/:qrToken');
  const req1 = mockReq({ qrToken: 'QR-ROOM101-BEDA' });
  const res1 = mockRes();
  await getBed(req1, res1);
  console.log('1. GET /bed/:qrToken -> status:', res1.statusCode, 'Room:', res1.data?.data?.roomNumber);
  if (res1.statusCode !== 200 || !res1.data?.data) throw new Error('Test 1 failed');

  const bedId = res1.data.data.id;

  // Test 2: POST /request
  const postReq = findHandler('post', '/request');
  const req2 = mockReq({}, { bedId, requestType: 'HELP_OUT_OF_BED', customNote: 'Assistance to chair' });
  const res2 = mockRes();
  await postReq(req2, res2);
  console.log('2. POST /request -> status:', res2.statusCode, 'Created ID:', res2.data?.data?.id, 'Type:', res2.data?.data?.requestType);
  if (res2.statusCode !== 201 || !res2.data?.data?.id) throw new Error('Test 2 failed');

  const createdId = res2.data.data.id;

  // Test 3: GET /active
  const getActive = findHandler('get', '/active');
  const req3 = mockReq();
  const res3 = mockRes();
  await getActive(req3, res3);
  console.log('3. GET /active -> status:', res3.statusCode, 'Active count:', res3.data?.count);
  if (res3.statusCode !== 200 || res3.data?.count < 1) throw new Error('Test 3 failed');

  // Test 4: PATCH /request/:id/status -> IN_PROGRESS
  const patchStatus = findHandler('patch', '/request/:id/status');
  const req4 = mockReq({ id: createdId }, { status: 'IN_PROGRESS' });
  const res4 = mockRes();
  await patchStatus(req4, res4);
  console.log('4. PATCH /request/:id/status (IN_PROGRESS) -> status:', res4.statusCode, 'AcknowledgedAt:', res4.data?.data?.acknowledgedAt);
  if (res4.statusCode !== 200 || !res4.data?.data?.acknowledgedAt) throw new Error('Test 4 failed');

  // Test 5: PATCH /request/:id/status -> RESOLVED
  const req5 = mockReq({ id: createdId }, { status: 'RESOLVED' });
  const res5 = mockRes();
  await patchStatus(req5, res5);
  console.log('5. PATCH /request/:id/status (RESOLVED) -> status:', res5.statusCode, 'ResolvedAt:', res5.data?.data?.resolvedAt);
  if (res5.statusCode !== 200 || !res5.data?.data?.resolvedAt) throw new Error('Test 5 failed');

  console.log('\n✅ All route handlers tested and verified successfully!');
}

runUnitTests().catch((err) => {
  console.error('Test error:', err);
  process.exit(1);
});

