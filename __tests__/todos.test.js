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
const mockUser2 = {
  firstName: 'Test',
  lastName: 'User 2',
  email: 'test2@example.com',
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

  it('GET /api/v1/todos returns all todos associated with the authenticated User', async () => {
    const [agent, user] = await registerAndLogin();
    const user2 = await UserService.create(mockUser2);
    const user1Todo = await Todo.insert({
      task_name: 'be the first user',
      user_id: user.id,
    });
    await Todo.insert({
      task_name: 'be a different user',
      user_id: user2.id,
    });
    const resp = await agent.get('/api/v1/todos');
    expect(resp.status).toEqual(200);
    expect(resp.body).toEqual([user1Todo]);
  });
  
  it('DELETE /api/v1/todos/:id deletes a todo if associated with authenticated user', async () => {
    const [agent, user] = await registerAndLogin();
    const todo = await Todo.insert({
      task_name: 'apples',
      user_id: user.id,
    });
    const resp = await agent.delete(`/api/v1/todos/${todo.id}`);
    expect(resp.status).toBe(200);

    const check = await Todo.getById(todo.id);
    expect(check).toBeNull();
  });

  it('All todo endpoints return a 401 if not authenticated', async () => {
    const getReq = await request(app).get('/api/v1/todos');
    expect(getReq.status).toEqual(401);
    const postReq = await request(app).post('/api/v1/todos');
    expect(postReq.status).toEqual(401);
    const putReq = await request(app).put('/api/v1/todos/4')
      .send({ bought: true });
    expect(putReq.status).toEqual(401);
    const deleteReq = await request(app).delete('/api/v1/todos/4');
    expect(deleteReq.status).toEqual(401);
  });

  it('POST / PUT todo endpoints return a 403 if a user tries to update a todo thats not theirs', async () => {
  // create a user
    const [agent] = await registerAndLogin();
    // create a second user
    const user2 = await UserService.create(mockUser2);
    const todo = await Todo.insert({
      task_name: 'apples',
      user_id: user2.id,
    });
    const resp = await agent
      .put(`/api/v1/todos/${todo.id}`)
      .send({ bought: true });
    expect(resp.status).toBe(403);
    const deleteResp = await agent
      .put(`/api/v1/todos/${todo.id}`)
      .send({ bought: true });
    expect(deleteResp.status).toBe(403);
  });
});
