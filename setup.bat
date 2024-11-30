@echo off
:: Check if Docker is installed
docker --version >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Docker is not installed. Please install Docker.
    exit /b 1
)

:: Check if Docker is running
docker info >nul 2>&1
IF %ERRORLEVEL% NEQ 0 (
    echo Docker is not running. Please start Docker.
    exit /b 1
)

:: Run docker-compose.yaml to bring up the containers
echo Running docker-compose up...
docker-compose -f docker-compose.yml up -d

:: Wait for 30 seconds to allow containers to be created and started
echo Waiting for containers to start...
sleep 120

:: Run test.js to check connection
echo Running test.js to check connection...
node test.js

:: Wait for 10 seconds for the user to check if connection is successful
echo Waiting for user to check the connection...
sleep 20

:: Run create_schema_tables.js to create keyspace and tables
echo Running create_schema_tables.js...
node create_schema_tables.js

:: Wait for 10 seconds for the schema to be created
echo Waiting for tables to be created...
sleep 30

:: Initialize npm project (if not already done)
echo Running npm init...
call npm init -y

:: Wait for npm init to complete
sleep 10

:: Install dependencies from package.json
echo Installing dependencies...
call npm install

:: Wait for dependencies to install
sleep 20

:: Start the server
echo Starting server...
call node server.js

:: Uncomment if running a development server
:: echo Running npm run dev...
:: call npm run dev

:: Wait for the server to start
echo Server should be running now.
sleep 30