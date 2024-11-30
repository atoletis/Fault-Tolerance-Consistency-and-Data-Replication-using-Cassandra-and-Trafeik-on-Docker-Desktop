const cassandra = require('cassandra-driver');
const { v4: uuidv4 } = require('uuid');
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

const client = new cassandra.Client({
  contactPoints: [localIP],  // Updated port for Traefik load balancer
  localDataCenter: 'datacenter1',
  keyspace: 'system'  // Use the system keyspace initially to create the keyspace
});

// Function to check and create keyspace if it doesn't exist
async function createKeyspaceIfNeeded() {
  const createKeyspaceQuery = `
    CREATE KEYSPACE IF NOT EXISTS ecommerce_keyspace 
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 3}
  `;
  try {
    await client.execute(createKeyspaceQuery);
    console.log('Keyspace "ecommerce_keyspace" is ready.');
  } catch (err) {
    console.error('Error creating keyspace:', err);
  }
}

// Function to check and create table if it doesn't exist
async function createTableIfNeeded() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ecommerce_keyspace.test_table (
      id UUID PRIMARY KEY,
      name TEXT,
      value INT
    )
  `;
  try {
    await client.execute(createTableQuery);
    console.log('Table "test_table" is ready.');
  } catch (err) {
    console.error('Error creating table:', err);
  }
}

async function insertData() {
  const query = 'INSERT INTO ecommerce_keyspace.test_table (id, name, value) VALUES (?, ?, ?)';
  const params = [uuidv4(), 'Jahnavi', 33];

  try {
    await client.execute(query, params, { prepare: true });
    console.log('Data inserted successfully into "test_table".');
  } catch (err) {
    console.error('Error inserting data into "test_table":', err);
  } finally {
    // Close the connection after the operation is done
    client.shutdown();
  }
}

async function run() {
  try {
    await createKeyspaceIfNeeded();
    // Reconnect to Cassandra using the newly created keyspace
    const clientWithKeyspace = new cassandra.Client({
      contactPoints: [localIP],
      localDataCenter: 'datacenter1',
      keyspace: 'ecommerce_keyspace' // Now use the created keyspace
    });

    await clientWithKeyspace.connect();

    console.log('Connected to Cassandra via Traefik');

    await createTableIfNeeded();
    await insertData();

    clientWithKeyspace.shutdown(); // Close the new client after operations are done
  } catch (err) {
    console.error('Error during setup or data insertion:', err);
  }
}

run();
