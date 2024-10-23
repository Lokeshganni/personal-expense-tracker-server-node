#Personal Expense Tracker API

###Overview

This is a RESTful API for managing personal financial records, such as incomes and expenses. Users can record their transactions, view past transactions, and get summarized reports by category or time period. The project also includes user authentication to link transactions to specific users.

###Features

Add, update, delete, and retrieve income/expense transactions.
Summarize total income, total expenses, and current balance.
Optional filtering for summaries by date range and category.
User authentication with JWT for protecting API routes.
Pagination for retrieving large numbers of transactions.
Reports for monthly spending by category.

###Technologies Used

Backend Framework: Node.js with Express.js
Database: SQLite
Authentication: JWT (JSON Web Token)

Getting Started

Prerequisites

Before you can run the project, you need the following:

Node.js installed (version 14+)
SQLite3 installed
Postman or any tool to test the APIs (optional)

Installation

Clone the repository:

git clone https://github.com/your-username/personal-expense-tracker.git
cd personal-expense-tracker-server

Install the dependencies:

npm install

Set up the SQLite database:

Run the provided SQL queries from db.js to create the necessary tables.

Run the application:

npm start

The server will start at http://localhost:3000.

API Endpoints

User Authentication

1. Signup (Create a new user)
Endpoint: POST /signup
Request Body:

{
  "username": "lokesh",
  "password": "lokesh123"
}

Response:
201 Created if the user is successfully created.
400 Bad Request if the username already exists.

2. Login (Generate JWT token)
Endpoint: POST /login
Request Body:

{
  "username": "lokesh",
  "password": "lokesh123"
}

Response:
200 OK with JWT token on successful login.
400 Bad Request if the username/password is invalid.

Transactions (Protected Endpoints)
All transaction-related routes require the user to be authenticated. Send the JWT token in the Authorization header:

Authorization: Bearer <JWT_TOKEN>

3. Add Transaction
Endpoint: POST /transactions
Request Body:

{
  "type": "income",
  "category": "Salary",
  "amount": 50000,
  "date": "2024-10-21",
  "description": "October Salary"
}

Response:
201 Created with the id of the newly created transaction.
500 Internal Server Error on failure.

4. Get All Transactions
Endpoint: GET /transactions?page=1&limit=10

Optional Query Parameters:
page: Specify the page of results (for pagination).
limit: Number of results per page.

Response:
200 OK with the list of transactions.
500 Internal Server Error on failure.

5. Get a Transaction by ID
Endpoint: GET /transactions/:id

Response:
200 OK with the transaction details.
404 Not Found if the transaction does not exist.

6. Update a Transaction
Endpoint: PUT /transactions/:id
Request Body (same as Add Transaction)

Response:
200 OK if the transaction is updated.
404 Not Found if the transaction does not exist.

7. Delete a Transaction
Endpoint: DELETE /transactions/:id

Response:
200 OK if the transaction is deleted.
404 Not Found if the transaction does not exist.

8. Get Summary
Endpoint: GET /summary?start_date=2024-01-01&end_date=2024-12-31&category=Salary

Optional Query Parameters:
start_date: Filter transactions from a specific date.
end_date: Filter transactions up to a specific date.
category: Filter by category.

Response:
200 OK with the total income, total expenses, and balance.

9. Monthly Report
Endpoint: GET /report/monthly

Response:
200 OK with the report of monthly spending by category.

Running Tests
You can test all the API endpoints using Postman or create an .http file in your project to make API requests.

Sample .http file:

### Signup
POST http://localhost:3000/signup
Content-Type: application/json

{
  "username": "lokesh",
  "password": "lokesh123"
}

### Login
POST http://localhost:3000/login
Content-Type: application/json

{
  "username": "lokesh",
  "password": "lokesh123"
}

### Add Transaction
POST http://localhost:3000/transactions
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "type": "income",
  "category": "Salary",
  "amount": 50000,
  "date": "2024-10-21",
  "description": "October Salary"
}

### Get Summary
GET http://localhost:3000/summary?start_date=2024-01-01&end_date=2024-12-31&category=Salary
Authorization: Bearer <JWT_TOKEN>

Project Structure

├── app.js               # Main application file
├── db.js                # Database configuration and queries
├── financialRecords.db  # SQLite database file
├── package.json         # Node.js dependencies and scripts
├── README.md            # API documentation
└── app.http             # Optional HTTP file for testing

