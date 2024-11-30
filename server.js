const express = require('express');
const cassandra = require('cassandra-driver');
const bcrypt = require('bcrypt');
const path = require('path');

const app = express();
const port = 3000;
const session = require('express-session');

// Use express-session to handle session
app.use(session({
  secret: 'aditya', // You can replace this with any secret string
  resave: false,
  saveUninitialized: true
}));

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
app.use(express.json());
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
          if (user.role === 'customer') {
            res.redirect(`/customer-main?username=${username}`);
          } else if (user.role === 'seller') {
            res.redirect(`/seller-main?username=${username}`);
          }
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
  const userId = cassandra.types.Uuid.random();
  const query = 'INSERT INTO users (id, created_at, username, password, role) VALUES (?, toTimestamp(now()), ?, ?, ?)';
  const params = [userId, username, encryptedPassword, role];

  client.execute(query, params, { prepare: true })
    .then(() => {
      // Insert data into customers or sellers table based on the role
      if (role === 'customer') {
        const customerQuery = 'INSERT INTO customers (customerid, name, email) VALUES (?, ?, ?)';
        return client.execute(customerQuery, [userId, username, email], { prepare: true });
      } else if (role === 'seller') {
        const sellerQuery = 'INSERT INTO sellers (sellerid, name, email, phone, address) VALUES (?, ?, ?, null, null)';
        return client.execute(sellerQuery, [userId, username, email], { prepare: true });
      }
    })
    .then(() => {
      res.render('login', { error: 'Signup successful, please log in.' });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error signing up');
    });
});

// Customer Main Page
app.get('/customer-main', (req, res) => {
  const { username } = req.query;
  const query = 'SELECT * FROM products';

  client.execute(query, [], { prepare: true })
    .then(result => {
      res.render('customer_main', { username, products: result.rows });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error fetching products');
    });
});

app.get('/list-product', (req, res) => {
    const { username } = req.query;
    res.render('list_product', { username });
  });
  
// Handle product listing by sellers
app.post('/list-product', (req, res) => {
    const { name, description, price, category, stocklevel, username } = req.body;
  
    // Fetch the seller's ID using their username
    const sellerQuery = 'SELECT sellerid FROM sellers WHERE name = ? ALLOW FILTERING';
  
    client.execute(sellerQuery, [username], { prepare: true })
      .then(result => {
        if (result.rowLength === 0) {
          return res.status(404).send('Seller not found');
        }
  
        // Seller ID found, insert the product into the products table
        const seller = result.rows[0];
        const productQuery = `
          INSERT INTO products (productid, sellerid, name, description, price, category, stocklevel) 
          VALUES (uuid(), ?, ?, ?, ?, ?, ?)
        `;
  
        return client.execute(productQuery, [
          seller.sellerid, name, description, parseFloat(price), category, parseInt(stocklevel)
        ], { prepare: true });
      })
      .then(() => {
        res.redirect(`/seller-main?username=${username}`); // Redirect to the seller's dashboard
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error listing product');
      });
  });
  
  
  // Updated Seller Main Page with product listing form
  app.get('/seller-main', (req, res) => {
    const { username } = req.query;
  
    // Fetch seller details and their products
    const sellerQuery = 'SELECT * FROM sellers WHERE name = ? ALLOW FILTERING';
  
    client.execute(sellerQuery, [username], { prepare: true })
      .then(result => {
        if (result.rowLength === 0) {
          return res.status(404).send('Seller not found');
        }
  
        const seller = result.rows[0];
        const productQuery = 'SELECT * FROM products WHERE sellerid = ? ALLOW FILTERING';
  
        return client.execute(productQuery, [seller.sellerid], { prepare: true })
          .then(productResult => {
            res.render('seller_main', { username, products: productResult.rows });
          });
      })
      .catch(err => {
        console.error(err);
        res.status(500).send('Error fetching seller products');
      });
  });
  

// Customer Profile Page
app.get('/profile', (req, res) => {
  const { username } = req.query;
  const query = 'SELECT * FROM customers WHERE name = ? ALLOW FILTERING';

  client.execute(query, [username], { prepare: true })
    .then(result => {
      if (result.rowLength === 0) {
        return res.status(404).send('Customer not found');
      }
      res.render('profile', { customer: result.rows[0] });
    })
    .catch(err => {
      console.error(err);
      res.status(500).send('Error fetching customer profile');
    });
});

// Update Customer Profile
app.post('/update-profile', (req, res) => {
    const { phone, address, username } = req.body;
    console.log( req.body);
  
    // Fetch customer ID
    const selectQuery = 'SELECT id FROM users WHERE username = ? ALLOW FILTERING';
    console.log(username);
    console.log(phone);
    client
      .execute(selectQuery, [username], { prepare: true })
      .then((result) => {
        if (result.rowLength === 0) {
          return res.status(404).send('User not found.');
        }
  
        const customerId = result.rows[0].id;
        console.log(result.rowLength);
  
        // Update customer details
        const updateQuery = 'UPDATE customers SET phone = ?, address = ? WHERE customerid = ?';
        client
          .execute(updateQuery, [phone, address, customerId], { prepare: true })
          .then(() => {
            res.redirect(`/customer-main?username=${username}`);
          })
          .catch((err) => {
            console.error('Error updating profile:', err);
            res.status(500).send('Error updating profile.');
          });
      })
      .catch((err) => {
        console.error('Error fetching customer ID:', err);
        res.status(500).send('Error fetching profile.');
      });
  });
  

// Add to Cart
app.post('/add-to-cart', (req, res) => {
    const { productId, productName, productPrice } = req.body;
    const { username } = req.query; // Assuming you pass username in the query
  
    // Save the product in the user's cart (stored in session or a database)
    const cartItem = {
      productId,
      productName,
      productPrice,
      quantity: 1, // Default quantity is 1 for now
      username
    };
  
    // Add the item to the session cart or database (example with session)
    if (!req.session.cart) {
      req.session.cart = [];
    }
    req.session.cart.push(cartItem);
  
    res.status(200).send('Product added to cart');
  });
  
  

// Show Cart Page
app.get('/show-cart', (req, res) => {
    const { username } = req.query;
    
    // Retrieve cart from the session
    const cartItems = req.session.cart;
    console.log(req.session.cart);
    
    // Render the cart page with cart items
    res.render('show_cart', { cartItems, username });
  });
  

// Checkout
app.post('/checkout', (req, res) => {
    const { username, paymentMethod } = req.body;
  
    // Retrieve cart from the session
    const cartItems = req.session.cart;
    console.log('username');
    console.log(username);
    
    // If the cart is empty, return an error
    if (cartItems.length === 0) {
      return res.status(400).send('Cart is empty');
    }
  
    const orderId = cassandra.types.Uuid.random();
    const orderQuery = 'INSERT INTO orders (orderid, customerid, orderdate, totalamount) VALUES (?, ?, toTimestamp(now()), ?)';
    const customerQuery = 'SELECT id FROM users WHERE username = ? ALLOW FILTERING';
  
    // Retrieve the customer ID based on username
    client.execute(customerQuery, ['qwerty'], { prepare: true })
      .then(customerResult => {
        if (customerResult.rowLength === 0) {
          // Send error response and stop further execution
          return res.status(400).send('Customer not found');
        }
  
        const customer = customerResult.rows[0];
        // Calculate the total amount of the order
        const totalAmount = cartItems.reduce((sum, item) => sum + (item.productPrice * item.quantity), 0);
  
        // Insert the order into the orders table
        return client.execute(orderQuery, [orderId, customer.customerid, totalAmount], { prepare: true })
          .then(() => {
            // Insert each item into the orderdetails table
            const orderDetailsPromises = cartItems.map(item => {
              return client.execute(
                'INSERT INTO orderdetails (orderdetailid, orderid, productid, quantity, priceperunit) VALUES (uuid(), ?, ?, ?, ?)',
                [orderId, item.productId, item.quantity, item.productPrice],
                { prepare: true }
              );
            });
            return Promise.all(orderDetailsPromises);
          });
      })
      .then(() => {
        // After successful checkout, clear the session cart
        req.session.cart = [];
  
        // Redirect the user to the customer main page after successful checkout
        return res.redirect(`/customer-main?username=${username}`);
      })
      .catch(err => {
        // Catch all errors, and make sure the response is only sent once
        console.error(err);
        if (!res.headersSent) {
          res.status(500).send('Error processing checkout');
        }
      });
  });
  
  

// Start server
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
