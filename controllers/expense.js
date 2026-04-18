const db = require('../util/database');


/**
 * ================= ADD EXPENSE =================
 */
exports.addExpense = async (req, res) => {
  try {
    const { amount, desc, category } = req.body;
    const userId = req.user.userId;

    if (!amount || !desc || !category) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    const [result] = await db.execute(
      `INSERT INTO expenses (amount, description, category, user_id)
       VALUES (?, ?, ?, ?)`,
      [amount, desc, category, userId]
    );

    return res.status(201).json({
      expenseId: result.insertId,
      userId
    });

  } catch (error) {
    console.error('Add Expense Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};


/**
 * ================= DELETE EXPENSE =================
 */
exports.deleteExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.userId;

    if (!expenseId || isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid Expense ID' });
    }

    const [result] = await db.execute(
      `DELETE FROM expenses 
       WHERE id = ? AND user_id = ?`,
      [expenseId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    return res.status(200).json({
      message: 'Expense deleted successfully'
    });

  } catch (error) {
    console.error('Delete Expense Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};


/**
 * ================= EDIT EXPENSE =================
 */
exports.editExpense = async (req, res) => {
  try {
    const expenseId = req.params.id;
    const userId = req.user.userId;
    const { amount, desc, category } = req.body;

    if (!expenseId || isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid Expense ID' });
    }

    const [result] = await db.execute(
      `UPDATE expenses 
       SET amount = ?, description = ?, category = ?
       WHERE id = ? AND user_id = ?`,
      [amount, desc, category, expenseId, userId]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Expense not found' });
    }

    // fetch updated expense
    const [rows] = await db.execute(
      `SELECT * FROM expenses WHERE id = ?`,
      [expenseId]
    );

    return res.status(200).json(rows[0]);

  } catch (error) {
    console.error('Edit Expense Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};


/**
 * ================= GET ALL EXPENSES =================
 */
exports.getAllExpenses = async (req, res) => {
  try {
    const userId = req.user.userId;

    const [rows] = await db.execute(
      `SELECT * FROM expenses 
       WHERE user_id = ?
       ORDER BY updated_at DESC`,
      [userId]
    );

    return res.status(200).json(rows);

  } catch (error) {
    console.error('Get Expenses Error:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};