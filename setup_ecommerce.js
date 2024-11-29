const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
  contactPoints: ['192.168.59.1:8082'], // Updated port for Traefik load balancer
  localDataCenter: 'datacenter1'
});

// Function to create a keyspace
async function createKeyspace() {
  const createKeyspaceQuery = `
    CREATE KEYSPACE IF NOT EXISTS ecommerce_keyspace
    WITH replication = {'class': 'SimpleStrategy', 'replication_factor': 1};
  `;

  try {
    await client.execute(createKeyspaceQuery);
    console.log('Keyspace "ecommerce_keyspace" created or already exists.');
  } catch (err) {
    console.error('Error creating keyspace:', err);
  }
}

// Function to create a users table
async function createTable() {
  const createTableQuery = `
    CREATE TABLE IF NOT EXISTS ecommerce_keyspace.users (
      id UUID PRIMARY KEY,
      username TEXT,
      password TEXT,
      role TEXT,
      created_at TIMESTAMP
    );
  `;

  try {
    await client.execute(createTableQuery);
    console.log('Table "users" created or already exists.');
  } catch (err) {
    console.error('Error creating table:', err);
  }
}

// Main execution
async function main() {
  try {
    await client.connect();
    console.log('Connected to Cassandra via Traefik');

    await createKeyspace();
    await createTable();
  } catch (err) {
    console.error('Error during operations:', err);
  } finally {
    await client.shutdown();
    console.log('Connection to Cassandra closed.');
  }
}

main();
