#!/bin/bash

# Check if Docker is installed
if ! command -v docker &> /dev/null
then
    echo "Docker is not installed. Please install Docker."
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null
then
    echo "Docker is not running. Please start Docker."
    exit 1
fi

# Run docker-compose.yaml to bring up the containers
echo "Running docker-compose up..."
docker-compose -f docker-compose.yml up -d

# Wait for 30 seconds to allow containers to be created and started
echo "Waiting for containers to start..."
sleep 120

# Run test.js to check connection
echo "Running test.js to check connection..."
node test.js

# Wait for 10 seconds for the user to check if connection is successful
echo "Waiting for user to check the connection..."
sleep 10

# Run create_schema_tables.js to create keyspace and tables
echo "Running create_schema_tables.js..."
node create_schema_tables.js

# Wait for 10 seconds for the schema to be created
echo "Waiting for tables to be created..."
sleep 20

# Initialize npm project (if not already done)
echo "Running npm init..."
npm init -y

# Install dependencies from package.json
echo "Installing dependencies..."
npm install

# Start the development server
echo "Running npm run dev..."
node server.js

# Wait for the server to be running
echo "Server should be running now."
sleep 10
