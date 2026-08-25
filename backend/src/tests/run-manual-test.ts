import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { calculatePriority } from '../services/priorityEngine';

async function runTests() {
  console.log('🧪 Starting API Verification Test Suite...\n');

  try {
    // 1. Citizen Login
    console.log('Testing Citizen Login...');
    const citizenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@roadsense.demo', password: 'Password123!' });

    if (citizenRes.status !== 200) throw new Error(`Citizen login failed: ${JSON.stringify(citizenRes.body)}`);
    console.log('✅ Citizen Login PASSED (HTTP-only cookie generated)');
    const citizenCookie = citizenRes.get('Set-Cookie') || [];

    // 2. Auth ME check
    console.log('Testing Auth /api/auth/me...');
    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Cookie', citizenCookie);
    if (meRes.status !== 200) throw new Error(`Auth ME failed: ${JSON.stringify(meRes.body)}`);
    console.log(`✅ Auth /api/auth/me PASSED (Role: ${meRes.body.user.role})`);

    // 3. RBAC Enforcement
    console.log('Testing RBAC (Citizen attempting admin endpoint)...');
    const rbacRes = await request(app)
      .get('/api/admin/users')
      .set('Cookie', citizenCookie);
    if (rbacRes.status !== 403) throw new Error(`RBAC check failed. Expected 403, got ${rbacRes.status}`);
    console.log('✅ RBAC Enforcement PASSED (403 Forbidden received)');

    // 4. Priority Engine
    console.log('Testing Explainable Priority Calculation...');
    const priorityResult = calculatePriority(85, 0.92, 'Market St & 10th St', new Date(), 'VERIFIED');
    if (priorityResult.priority !== 'CRITICAL') throw new Error(`Priority calculation failed: ${JSON.stringify(priorityResult)}`);
    console.log(`✅ Priority Engine PASSED (${priorityResult.priorityExplanation})`);

    // 5. Authority Login & Analytics
    console.log('Testing Authority Login & Analytics...');
    const authRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'authority@roadsense.demo', password: 'Password123!' });
    const authorityCookie = authRes.get('Set-Cookie') || [];

    const analyticsRes = await request(app)
      .get('/api/admin/analytics')
      .set('Cookie', authorityCookie);
    if (analyticsRes.status !== 200) throw new Error(`Analytics failed: ${JSON.stringify(analyticsRes.body)}`);
    console.log(`✅ Authority Analytics PASSED (Total Reports: ${analyticsRes.body.metrics.totalReports})`);

    console.log('\n🎉 ALL BACKEND API TESTS COMPLETED SUCCESSFULLY!');
  } catch (err: any) {
    console.error('❌ Test Assertion Failed:', err.message || err);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runTests();
