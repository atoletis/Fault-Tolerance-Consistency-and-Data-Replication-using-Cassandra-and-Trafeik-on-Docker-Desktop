const express = require('express');
const cassandra = require('cassandra-driver');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;

// Set up EJS as the templating engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Cassandra client configuration
const client = new cassandra.Client({
  contactPoints: ['192.168.59.1:8082'], // Updated port for Traefik load balancer
  localDataCenter: 'datacenter1',
  keyspace: 'ecommerce_keyspace'
});

// Middleware to parse form data
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// Serve the login page
app.get('/login', (req, res) => {
  res.render('login', { error: null });
});

// Serve the signup page
app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

// Handle login
app.post('/login', (req, res) => {
  const { username, password } = req.body;
  const query = 'SELECT * FROM users WHERE username = ? ALLOW FILTERING';

  client.execute(query, [username], { prepare: true })
    .then(result => {
      if (result.rowLength === 0) {
        return res.render('login', { error: 'User not found' });
      }

      const user = result.rows[0];
      bcrypt.compare(password, user.password, (err, isMatch) => {
        if (err) throw err;
        if (isMatch) {
          res.render('main'); // Render main page using EJS template
        } else {
          res.render('login', { error: 'Invalid username or password' });
        }
      });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Server error');
    });
});

// Handle signup
app.post('/signup', (req, res) => {
  const { username, email, password, role } = req.body;
  const encryptedPassword = bcrypt.hashSync(password, 10);
  const query = 'INSERT INTO users (id, created_at, username, password, role) VALUES (uuid(), toTimestamp(now()), ?, ?, ?)';
  const params = [username, encryptedPassword, role];

  client.execute(query, params, { prepare: true })
    .then(() => {
      res.render('login', { error: 'Signup successful, please log in.' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error signing up');
    });
});

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
