const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: ['192.168.59.1:8082'], // Updated port for Traefik load balancer
  localDataCenter: 'datacenter1',
  keyspace: 'ecommerce_keyspace',
});

async function createTables() {
  try {
    // Create Customers table
    const createCustomersTable = `
      CREATE TABLE IF NOT EXISTS customers (
        customerid UUID PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone TEXT,
        address TEXT
      );
    `;
    await client.execute(createCustomersTable);
    console.log('Customers table created.');

    // Create Sellers table
    const createSellersTable = `
      CREATE TABLE IF NOT EXISTS sellers (
        sellerid UUID PRIMARY KEY,
        name TEXT,
        email TEXT,
        phone BIGINT,
        address TEXT
      );
    `;
    await client.execute(createSellersTable);
    console.log('Sellers table created.');

    // Create Products table
    const createProductsTable = `
      CREATE TABLE IF NOT EXISTS products (
        productid UUID PRIMARY KEY,
        sellerid UUID,
        name TEXT,
        description TEXT,
        price DECIMAL,
        category TEXT,
        stocklevel INT
      );
    `;
    await client.execute(createProductsTable);
    console.log('Products table created.');

    // Create Orders table
    const createOrdersTable = `
      CREATE TABLE IF NOT EXISTS orders (
        orderid UUID PRIMARY KEY,
        customerid UUID,
        orderdate TIMESTAMP,
        totalamount DECIMAL
      );
    `;
    await client.execute(createOrdersTable);
    console.log('Orders table created.');

    // Create Transactions table
    const createTransactionsTable = `
      CREATE TABLE IF NOT EXISTS transactions (
        transactionid UUID PRIMARY KEY,
        orderid UUID,
        transactiondate TIMESTAMP,
        paymentmethod TEXT,
        status TEXT
      );
    `;
    await client.execute(createTransactionsTable);
    console.log('Transactions table created.');

    // Create OrderDetails table
    const createOrderDetailsTable = `
      CREATE TABLE IF NOT EXISTS orderdetails (
        orderdetailid UUID PRIMARY KEY,
        orderid UUID,
        productid UUID,
        quantity INT,
        priceperunit DECIMAL
      );
    `;
    await client.execute(createOrderDetailsTable);
    console.log('OrderDetails table created.');

    console.log('All tables created successfully.');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    client.shutdown();
  }
}

client.connect((err) => {
  if (err) {
    console.error('Error connecting to Cassandra:', err);
  } else {
    console.log('Connected to Cassandra.');
    createTables();
  }
});
