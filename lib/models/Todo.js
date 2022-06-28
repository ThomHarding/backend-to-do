const pool = require('../utils/pool');

module.exports = class Todo {
  id;
  task_name;
  user_id;
  bought;

  constructor(row) {
    this.id = row.id;
    this.task_name = row.task_name;
    this.user_id = row.user_id;
    this.bought = row.bought;
  }

  static async insert({ task_name, user_id }) {
    const { rows } = await pool.query(
      `
      INSERT INTO todos (task_name, user_id)
      VALUES ($1, $2)
      RETURNING *
    `,
      [task_name, user_id]
    );

    return new Todo(rows[0]);
  }
  
  static async updateById(id, attrs) {
    const todo = await Todo.getById(id);
    if (!todo) return null;
    const { task_name, bought } = { ...todo, ...attrs };
    const { rows } = await pool.query(
      `
      UPDATE todos 
      SET task_name=$2, bought=$3
      WHERE id=$1 RETURNING *`,
      [id, task_name, bought]
    );
    return new Todo(rows[0]);
  }

  static async getById(id) {
    const { rows } = await pool.query(
      `
      SELECT *
      FROM todos
      WHERE id=$1
      `,
      [id]
    );
    if (!rows[0]) {
      return null;
    }
    return new Todo(rows[0]);
  }
};
