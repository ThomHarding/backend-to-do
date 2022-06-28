const pool = require('../utils/pool');

module.exports = class Item {
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

    return new Item(rows[0]);
  }

};
