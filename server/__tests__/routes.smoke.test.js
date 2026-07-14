const express = require('express');
const session = require('express-session');
const request = require('supertest');

const authRoutes = require('../routes/auth');
const accessRoutes = require('../routes/access');
const internApplicationRoutes = require('../routes/internApplications');

function createTestApp() {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(
    session({
      secret: 'test-secret',
      resave: false,
      saveUninitialized: false
    })
  );
  app.use('/api/auth', authRoutes);
  app.use('/api/access', accessRoutes);
  app.use('/api/intern-applications', internApplicationRoutes);
  return app;
}

describe('Route smoke tests', () => {
  test('POST /api/auth/register returns 400 when required fields are missing', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/auth/register').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/provide name, email and password/i);
  });

  test('POST /api/access/verify-code returns 400 when code is missing', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/access/verify-code').send({});
    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/access code required/i);
  });

  test('POST /api/intern-applications returns 401 without session/JWT', async () => {
    const app = createTestApp();
    const res = await request(app).post('/api/intern-applications').send({});
    expect(res.status).toBe(401);
    expect(res.body.error).toMatch(/not authenticated/i);
  });
});

