const pool = require('../lib/utils/pool');
const setup = require('../data/setup');
const request = require('supertest');
const app = require('../lib/app');
const UserService = require('../lib/services/UserService');
const Todo = require('../lib/models/Todo');

const mockUser = {
  firstName: 'Test',
  lastName: 'User',
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

describe('todo tests', () => {
  beforeEach(() => {
    return setup(pool);
  });
  afterAll(() => {
    pool.end();
  });

  it('POST /api/v1/todos/ creates a new todo for the authenticated user', async () => {
    const [agent, user] = await registerAndLogin();
    const newTodo = { task_name: 'test this deliverable' };
    const resp = await agent.post('/api/v1/todos').send(newTodo);
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual({
      id: expect.any(String),
      task_name: newTodo.task_name,
      user_id: user.id,
      bought: false,
    });

    it('PUT /api/v1/todos/:id updates a todo if associated with authenticated user', async () => {
      const [agent, user] = await registerAndLogin();
      const todo = await Todo.insert({
        task_name: 'buy some apples',
        user_id: user.id,
      });
      const resp = await agent
        .put(`/api/v1/todos/${todo.id}`)
        .send({ bought: true });
      expect(resp.status).toBe(200);
      expect(resp.body).toEqual({ ...todo, bought: true });
    });

    // GET /api/v1/todos/ lists all todos for the authenticated user
    // DELETE /api/v1/todos/:id deletes a todo if associated with authenticated user
    // PUT and DELETE routes use an authorize middleware to check authed user
    // All todo endpoints return a 401 if not authenticated
    // POST / PUT todo endpoints return a 403 if a user tries to update a todo that's not theirs
  });
});
