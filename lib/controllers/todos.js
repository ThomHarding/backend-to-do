const { Router } = require('express');
const authenticate = require('../middleware/authenticate');
const authorizeTodo = require('../middleware/authorizeTodo');
const Todo = require('../models/Todo');

module.exports = Router()

  .post('/', authenticate, async (req, res, next) => {
    try {
      const todo = await Todo.insert({ ...req.body, user_id: req.user.id });
      res.json(todo);
    } catch (e) {
      next(e);
    }
  })
  .put('/:id', authenticate, authorizeTodo, async (req, res, next) => {
    try {
      const todo = await Todo.updateById(req.params.id, req.body);
      res.json(todo);
    } catch (e) {
      next(e);
    }
  })
  .get('/', authenticate, async (req, res, next) => {
    try {
      const items = await Todo.getAll(req.user.id);
      res.json(items);
    } catch (e) {
      next(e);
    }
  });
