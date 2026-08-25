import request from 'supertest';
import app from '../app';
import { prisma } from '../config/prisma';
import { getJwtSecret } from '../config/jwt';
import { validateEnvironment } from '../config/envValidation';

describe('Production Security & RBAC Hardening Test Suite', () => {
  let citizenToken: string[];
  let anotherCitizenToken: string[];
  let testReportId: string;

  let savedEnv: {
    NODE_ENV?: string;
    JWT_SECRET?: string;
    SUPABASE_URL?: string;
  };

  beforeEach(() => {
    savedEnv = {
      NODE_ENV: process.env.NODE_ENV,
      JWT_SECRET: process.env.JWT_SECRET,
      SUPABASE_URL: process.env.SUPABASE_URL,
    };
  });

  afterEach(() => {
    if (savedEnv.NODE_ENV !== undefined) {
      process.env.NODE_ENV = savedEnv.NODE_ENV;
    } else {
      delete process.env.NODE_ENV;
    }

    if (savedEnv.JWT_SECRET !== undefined) {
      process.env.JWT_SECRET = savedEnv.JWT_SECRET;
    } else {
      delete process.env.JWT_SECRET;
    }

    if (savedEnv.SUPABASE_URL !== undefined) {
      process.env.SUPABASE_URL = savedEnv.SUPABASE_URL;
    } else {
      delete process.env.SUPABASE_URL;
    }
  });

  beforeAll(async () => {
    // Login citizen 1
    const res1 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'citizen@roadsense.demo', password: 'Password123!' });
    citizenToken = res1.get('Set-Cookie') || [];

    // Login worker (acts as separate entity)
    const res2 = await request(app)
      .post('/api/auth/login')
      .send({ email: 'worker@roadsense.demo', password: 'Password123!' });
    anotherCitizenToken = res2.get('Set-Cookie') || [];

    // Find a report created by citizen for IDOR testing
    const report = await prisma.potholeReport.findFirst({
      where: { reporter: { email: 'citizen@roadsense.demo' } },
    });
    if (report) {
      testReportId = report.id;
    }
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('1. Environment Validation & JWT Hardening', () => {
    it('should throw an error in production if required JWT_SECRET is missing or insecure', () => {
      process.env.NODE_ENV = 'production';
      process.env.JWT_SECRET = 'roadsense_ai_super_secret_jwt_key_2026';

      expect(() => getJwtSecret()).toThrow(
        'JWT_SECRET environment variable is missing or insecure in production environment'
      );
    });

    it('should throw an error in production if SUPABASE_URL is missing', () => {
      process.env.NODE_ENV = 'production';
      delete process.env.SUPABASE_URL;

      expect(() => validateEnvironment()).toThrow('CRITICAL ENVIRONMENT ERROR');
    });
  });

  describe('2. CORS Policy Enforcement', () => {
    it('should block requests from unauthorized origin headers', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://malicious-hacker-site.com');

      expect(res.status).toBe(500);
      expect(res.text).toContain('CORS Policy');
    });

    it('should allow requests from whitelisted localhost origin', async () => {
      const res = await request(app)
        .get('/api/health')
        .set('Origin', 'http://localhost:3000');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
    });
  });

  describe('3. IDOR & Access Control Security', () => {
    it('should reject unauthenticated access to protected report endpoints', async () => {
      const res = await request(app).get('/api/reports');
      expect(res.status).toBe(401);
      expect(res.body.error).toContain('Authentication required');
    });

    it('should prevent non-admin users from accessing user administration endpoints', async () => {
      const res = await request(app)
        .get('/api/admin/users')
        .set('Cookie', citizenToken);

      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });
  });
});
