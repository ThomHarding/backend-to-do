const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');

// const ONE_DAY_IN_MS = 1000 * 60 * 60 * 24;
// const IS_DEPLOYED = process.env.NODE_ENV === 'production';

const mockUser = {
  email: 'test@example.com',
  password: '123456',
};

const registerAndLogin = async (userProps = {}) => {
  const password = userProps.password ?? mockUser.password;
  
  const agent = request.agent(app);
  
  const user = await UserService.create({ ...mockUser, ...userProps });
  
  const { email } = user;
  await agent.post('/api/v1/users/sessions').send({ email, password });
  return [agent, user];
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

  it('POST /api/v1/users/sessions signs in a new user and creates a cookie', async (userProps = {}) => {
    const password = userProps.password ?? mockUser.password;

    const agent = request.agent(app);
    const user = await UserService.create({ ...mockUser, ...userProps });
  
    const { email } = user;
    const res = await agent.post('/api/v1/users/sessions').send({
      email,
      password });
    expect(res.body).toEqual({
      message: 'Signed in successfully!'
    });
  });

  it('POST /api/v1/users/me returns the authenticated user', async () => {
    const [agent, user] = await registerAndLogin();
    const me = await agent.post('/api/v1/users/me');
    expect(me.body).toEqual({
      ...user,
      exp: expect.any(Number),
      iat: expect.any(Number),
    });
  });
});
