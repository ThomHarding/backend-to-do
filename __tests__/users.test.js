const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
// const UserService = require('../lib/services/UserService');

// const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
const IS_DEPLOYED = process.env.NODE_ENV === 'production';

const mockUser = {
  email: 'test@example.com',
  password: '123456',
};

describe('users', () => {
  beforeEach(() => {
    return setup(pool);
  });

  afterAll(() => {
    pool.end();
  });

  it('POST /api/v1/users/ creates a new user', async () => {
    const res = await request(app).post('/api/v1/users').send(mockUser);
    const { email } = mockUser;

    expect(res.body).toEqual({
      id: expect.any(String),
      email,
    });
  });

  it('POST /api/v1/users/sessions signs in a new user and creates a cookie', async () => {
    const res = await request(app).post('/api/v1/users/sessions').send(mockUser);
    expect(res.body).toEqual({
      message: 'Signed in successfully!'
    });
    expect(res.cookie).toBeTruthy();
  });

});
