const cassandra = require('cassandra-driver');
const { v4: uuidv4 } = require('uuid');

const client = new cassandra.Client({
  contactPoints: ['192.168.59.1:9042'],  // Updated port for Traefik load balancer
  localDataCenter: 'datacenter1',
  keyspace: 'my_keyspace'
});

client.connect((err) => {
  if (err) {
    console.error('Error connecting to Cassandra:', err);
  } else {
    console.log('Connected to Cassandra via Traefik');

    const query = 'INSERT INTO users (user_id, name, age) VALUES (?, ?, ?)';
    const params = [uuidv4(), 'Aditya23', 33];

    client.execute(query, params, { prepare: true }, (err) => {
      if (err) {
        console.error('Error inserting data into Cassandra:', err);
      } else {
        console.log('Data inserted successfully via Traefik');
      }

      // Close the connection after the operation is done
      client.shutdown();
    });
  }
});
