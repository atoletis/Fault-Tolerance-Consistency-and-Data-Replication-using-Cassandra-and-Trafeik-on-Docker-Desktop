const cassandra = require('cassandra-driver');
const os = require('os');

// Function to get the local IP address
function getLocalIP() {
  const networkInterfaces = os.networkInterfaces();
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    
    for (const networkInterface of interfaces) {
      if (networkInterface.family === 'IPv4' && !networkInterface.internal) {
        return networkInterface.address;
      }
    }
  }
  
  return null; // If no valid IPv4 address is found
}

const localIP = getLocalIP() + ':8082';

// Initial client to connect to the system keyspace (for creating the new keyspace)
const client = new cassandra.Client({
  contactPoints: [localIP],  // Updated port for Traefik load balancer
  localDataCenter: 'datacenter1',
  keyspace: 'system'  // Use the system keyspace to manage keyspace creation
});

// Function to create the keyspace if it doesn't exist
async function createKeyspace() {
  const createKeyspaceQuery = `
    CREATE KEYSPACE IF NOT EXISTS ecommerce_keyspace WITH replication = {
      'class': 'SimpleStrategy', 'replication_factor': 3
    };
  `;
  try {
    await client.execute(createKeyspaceQuery);
    console.log('Keyspace created or already exists.');
  } catch (err) {
    console.error('Error creating keyspace:', err);
    throw err;  // Rethrow error if keyspace creation fails
  }
}

// Function to create tables
async function createTables() {
  // New client to connect to the 'ecommerce_keyspace' after creating it
  const clientWithKeyspace = new cassandra.Client({
    contactPoints: [localIP],
    localDataCenter: 'datacenter1',
    keyspace: 'ecommerce_keyspace',
  });

  try {
    await clientWithKeyspace.connect();
    console.log('Connected to "ecommerce_keyspace".');

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
    await clientWithKeyspace.execute(createCustomersTable);
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
    await clientWithKeyspace.execute(createSellersTable);
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
    await clientWithKeyspace.execute(createProductsTable);
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
    await clientWithKeyspace.execute(createOrdersTable);
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
    await clientWithKeyspace.execute(createTransactionsTable);
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
    await clientWithKeyspace.execute(createOrderDetailsTable);
    console.log('OrderDetails table created.');

    // Create Users table (added)
    const createUsersTable = `
      CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY,
        created_at TIMESTAMP,
        username TEXT,
        password TEXT,
        role TEXT
      );
    `;
    await clientWithKeyspace.execute(createUsersTable);
    console.log('Users table created.');

    console.log('All tables created successfully.');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    clientWithKeyspace.shutdown(); // Shutdown the new client after operations
  }
}

// Function to connect, create keyspace, then create tables
async function run() {
  try {
    // Step 1: Connect and create keyspace
    await client.connect();
    console.log('Connected to Cassandra.');

    // Step 2: Create keyspace
    await createKeyspace();

    // Step 3: After keyspace is created, create tables in 'ecommerce_keyspace'
    await createTables();
  } catch (err) {
    console.error('Error during setup:', err);
  } finally {
    client.shutdown();  // Shutdown the initial client
  }
}

// Run the whole process
run();
