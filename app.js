const express = require('express');
const initializeDB = require('./db');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const app = express();

app.use(express.json());

let db;

// initialising server
const initialiseServer = async () => {
    try {
      db = await initializeDB();
      app.listen(3000, () => {
        console.log("Server running at PORT 3000");
      });
    } catch (e) {
      console.log(`DB ERROR: ${e.message}`);
      process.exit(1);
    }
};
  
initialiseServer();

//middleware to check user authentication
const authenticateToken = (req, res, next) => {
    let jwtTok;
    const authHeader = req.headers["authorization"];
    if (authHeader) {
      jwtTok = authHeader.split(" ")[1];
    }
    if (!jwtTok) {
      return res.status(401).json({ error: 'No JWT Token' });
    } else {
      jwt.verify(jwtTok, "secretekey", async (err, payload) => {
        if (err) {
          return res.status(401).json({ error: 'Invalid JWT Token' });
        } else {
          next();
        }
      });
    }
};  
  
// api to add user credentials to db and creating user
app.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  try {
    const checkUserQuery = `SELECT * FROM users WHERE username = ?`;
    const existingUser = await db.get(checkUserQuery, [username]);

    if (existingUser) {
      return res.status(400).json({ message: 'Username already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const insertUserQuery = `INSERT INTO users (username, password) VALUES (?, ?)`;
    await db.run(insertUserQuery, [username, hashedPassword]);

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});


// api to verify user login 
app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const getUserQuery = `SELECT * FROM users WHERE username = ?`;
    const user = await db.get(getUserQuery, [username]);

    if (!user) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);

    if (!isValidPassword) {
      return res.status(400).json({ message: 'Invalid username or password' });
    }

    const token = jwt.sign({ username: user.username }, 'secretekey');

    return res.status(200).json({ token });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

  

// api to add a new transaction
app.post('/transactions',authenticateToken, (req, res) => {
  const { type, category, amount, date, description } = req.body;
  const query = `INSERT INTO transactions (type, category, amount, date, description) VALUES (?, ?, ?, ?, ?)`;
  db.run(query, [type, category, amount, date, description], function (err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    } else {
      return res.status(201).json({ id: this.lastID });
    }
  });
});

// api to get paginated transactions data
app.get('/transactions', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { limit = 10, offset = 0 } = req.query; 
  const query = `SELECT * FROM transactions WHERE user_id = ? LIMIT ? OFFSET ?`;
  db.all(query, [userId, limit, offset], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json(rows);
  });
});


// api to get a particular transaction by given ID
app.get('/transactions/:id',authenticateToken, (req, res) => {
  const query = `SELECT * FROM transactions WHERE id = ?`;
  db.get(query, [req.params.id], (err, row) => {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (row) {
      res.json(row);
    } else {
      res.status(404).json({ error: "Transaction not found" });
    }
  });
});

// api to update a particular transaction by given ID
app.put('/transactions/:id',authenticateToken, (req, res) => {
  const { type, category, amount, date, description } = req.body;
  const query = `UPDATE transactions SET type = ?, category = ?, amount = ?, date = ?, description = ? WHERE id = ?`;
  db.run(query, [type, category, amount, date, description, req.params.id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes) {
      res.json({ message: "Transaction updated successfully" });
    } else {
      res.status(404).json({ error: "Transaction not found" });
    }
  });
});

// api to delete a particular transaction by given ID
app.delete('/transactions/:id',authenticateToken, (req, res) => {
  const query = `DELETE FROM transactions WHERE id = ?`;
  db.run(query, [req.params.id], function (err) {
    if (err) {
      res.status(500).json({ error: err.message });
    } else if (this.changes) {
      res.json({ message: "Transaction deleted successfully" });
    } else {
      res.status(404).json({ error: "Transaction not found" });
    }
  });
});

// api to get transactions summary
app.get('/summary',authenticateToken, (req, res) => {
    const { start_date, end_date, category } = req.query;
  
    let query = `SELECT 
                  SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) AS total_income,
                  SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expense
                 FROM transactions`;
  
    let queryParams = [];

    // raising error if any of the date is missing
    if ((start_date && !end_date) || (!start_date && end_date)) {
        return res.status(400).json({ error: 'Both start_date and end_date are required for date range filtering.' });
    }
  
    // adding query for filtering data in a date range if both the dates are provided
    if (start_date && end_date) {
      query += ` WHERE date BETWEEN ? AND ?`;
      queryParams.push(start_date, end_date);
    }
    
    // adding query for filtering data based on category
    if (category) {
      query += (queryParams.length ? ' AND' : ' WHERE') + ` category = ?`;
      queryParams.push(category);
    }
  
    db.get(query, queryParams, (err, row) => {
      if (err) {
        return res.status(500).json({ error: err.message });
      } else {
        const totalIncome = row.total_income || 0;
        const totalExpense = row.total_expense || 0;
        const balance = totalIncome - totalExpense;
  
        return res.status(200).json({
          total_income: totalIncome,
          total_expense: totalExpense,
          balance: balance
        });
      }
    });
});
  
// api to get monthly reports
app.get('/reports', authenticateToken, (req, res) => {
  const userId = req.user.id;
  const { month, year } = req.query;

  if (!month || !year) {
    return res.status(400).json({ error: 'Month and year are required' });
  }

  const query = `
    SELECT category, SUM(amount) AS total_spent 
    FROM transactions 
    WHERE user_id = ? AND type = 'expense' AND strftime('%m', date) = ? AND strftime('%Y', date) = ?
    GROUP BY category
  `;

  db.all(query, [userId, month.padStart(2, '0'), year], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    return res.status(200).json(rows);
  });
});
