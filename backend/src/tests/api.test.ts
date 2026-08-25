import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { calculatePriority } from '../services/priorityEngine';

describe('RoadSense AI Backend Test Suite', () => {
  let citizenCookie: string[];
  let workerCookie: string[];
  let authorityCookie: string[];
  let adminCookie: string[];

  beforeAll(async () => {
    const citizenRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@roadsense.demo', password: 'Password123!' });
    citizenCookie = citizenRes.get('Set-Cookie') || [];

    const workerRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'worker@roadsense.demo', password: 'Password123!' });
    workerCookie = workerRes.get('Set-Cookie') || [];

    const authorityRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'authority@roadsense.demo', password: 'Password123!' });
    authorityCookie = authorityRes.get('Set-Cookie') || [];

    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@roadsense.demo', password: 'Password123!' });
    adminCookie = adminRes.get('Set-Cookie') || [];
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Authentication & RBAC Tests', () => {
    it('should login demo citizen successfully and set HTTP-only cookie', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'citizen@roadsense.demo', password: 'Password123!' });
      
      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('citizen@roadsense.demo');
      expect(res.get('Set-Cookie')).toBeDefined();
    });

    it('should reject invalid password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'citizen@roadsense.demo', password: 'WrongPassword' });

      expect(res.status).toBe(401);
    });

    it('should return authenticated user profile on /api/auth/me', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Cookie', citizenCookie);

      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('CITIZEN');
    });

    it('should prevent CITIZEN from calling admin endpoints (RBAC check)', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', citizenCookie);

      expect(res.status).toBe(403);
    });
  });

  describe('2. Priority Engine Calculation', () => {
    it('should accurately calculate explainable priority score for critical severity', () => {
      const result = calculatePriority(90, 0.95, 'Highway 101 Exit 4', new Date(), 'VERIFIED');
      expect(result.priority).toBe('CRITICAL');
      expect(result.priorityScore).toBeGreaterThanOrEqual(76);
      expect(result.priorityExplanation).toContain('CRITICAL priority');
    });

    it('should calculate low priority score for shallow surface crack', () => {
      const result = calculatePriority(15, 0.60, 'Quiet Residential Lane', new Date(), 'PENDING');
      expect(result.priority).toBe('LOW');
      expect(result.priorityScore).toBeLessThanOrEqual(30);
    });
  });

  describe('3. Pothole Report Lifecycle & State Machine', () => {
    it('should allow CITIZEN to view their reports', async () => {
      const res = await request(app)
        .get('/api/reports')
        .set('Cookie', citizenCookie);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.reports)).toBe(true);
    });

    it('should allow AUTHORITY to view all analytics', async () => {
      const res = await request(app)
        .get('/api/admin/analytics')
        .set('Cookie', authorityCookie);

      expect(res.status).toBe(200);
      expect(res.body.metrics.totalReports).toBeGreaterThan(0);
    });
  });
});
