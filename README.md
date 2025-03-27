# 📊 Project Name: Personal Finance Tracker

Welcome to the **Personal Finance Tracker** project! This web application allows users to track their expenses and incomes, manage transactions, set their budgets and goals, and generate financial reports. It incorporates best practices for security, user authentication, real-time notifications, recommendations and proper database management.

### 🎯 Features:
- User authentication and role-based access control
- Manage user Transactions.
- Multi-currency support with real-time exchange rates
- Setting Goals and Track Progress
- Automatic generation of Recurring transactions based on specific patterns.
- Automatic 5% Savings allocation from incomes
- Budget allocation and Auto-update the Current amounts
- Real-time Notifications, Alerts and Recommendations
- Role-Based Financial reports 
- Easy-to-use API for integrations
- Comprehensive security measures to protect sensitive data


---

## 🚀 Getting Started

Follow these instructions to get the project up and running.

### Prerequisites 🔑:

1. **Node.js** 
2. **Express.js**
3. **MongoDB Atlas**  
4. **Postman**

### Tools and Libraries for Testing Purposes 🛠️:

1. **Jest** - (Unit testing framework)
2. **Artillery.io** - (Performance testing tool)
3. **express-validator** - (Data validation for requests)
4. **bcryptjs** - (Password hashing for user authentication)
5. **cors** - (Cross-Origin Resource Sharing middleware)
6. **express-rate-limit** - (Rate limiting for the API)
7. **jsonwebtoken** - (JWT for secure authentication)
8. **mongoose-encryption** - (Encrypt sensitive data in MongoDB)

### Steps 👣:

1. Clone this repository:

    ```bash
    git clone https://github.com/SE1020-IT2070-OOP-DSA-25/project-SiyumiSathnaraKumarasinghe.git
    ```

2. Navigate into the project folder:

    ```bash
    cd backend
    ```

3. Install the required dependencies:

    ```bash
    npm install
    ```

4. **Configure environment variables:**
    - If you don't have a `.env` file, create one as `.env` inside backend folder.
    - If you already have a `.env` file, make sure to set the values for your MongoDB Atlas URI, JWT secret, and other necessary configurations.

    Example of `.env` content:
    ```plaintext
    MONGO_URI=mongodb+srv://<your_username>:<your_password>@cluster0.n50y7.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
    JWT_SECRET=<your_secret_key>
    PORT=5001
    EXCHANGE_RATE_API_KEY=<your_api_key>
    ```

5. Run the application:

    ```bash
    node app.js
    ```

    Your server should now be running at `http://localhost:5001`.


### Testing Commands 📜:

- Unit Testing
  
  ```bash
  npm test
  ```
- Integration Testing

  ```bash
  npm run test:integration
  ```
- Performance Testing

  ```bash
  artillery run test/performance/performance-test.yml
  ```


---

# API Documentation Guidelines

## Authentication Routes 🔑

### POST `/api/auth/register` ✍️📝

- **Description**: Registers a new user in the system.
- **Request Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "password123",
      "role": "regular"
    }
    ```
### POST `/api/auth/login` ✍️📝

- **Description**: Logs in a user and returns a JWT token.
- **Request Body**:
    ```json
    {
      "name": "John Doe",
      "email": "john@example.com",
      "password": "password123"
    }
    ```

## Transaction Routes 💸

### POST `/api/transactions` ✍️📝

- **Description**: Creates a new transaction for the logged-in user.
- **Request Body**:
    ```json
    {
      "type": "expense",
      "amount": 50,
      "currency": "USD",
      "category": "Food",
      "date": "2025-02-24",
      "notes": "Dinner with friends",
      "tags": ["restaurant", "fun"],
      "isRecurring": false,
      "recurrencePattern": "weekly"
    }
    ```
    
### GET `/api/transactions` 📄🔍

- **Description**: Fetches a list of transactions for the logged-in user.  

### GET `/api/transactions/{id}` 📄🔍

- **Description**: Fetches a transaction by its ID (Admin can see any, regular users can only see their own).

### PUT `/api/transactions/{id}` 🔄🛠

- **Description**: Updates a transaction (Adjusts Budget) with Currency Conversion.

### DELETE `/api/transactions/{id}` ❌🗑

- **Description**: Deletes a transaction (Adjusts Budget).

## Goals Routes 🎯

### POST `/api/goals` ✍️📝

- **Description**: Creates a new financial goal for the logged-in user.
- **Request Body**:
    ```json
    {
      "name": "Save for vacation",
      "targetAmount": 5000,
      "deadline": "2025-12-31"
    }
    ```
### GET `/api/goals` 📄🔍

- **Description**: Fetches all goals for the logged-in user (Admin can see all, users can only see their own).

### GET `/api/goals/{id}` 📄🔍

- **Description**: Fetches a goal by ID (Admin can see any, regular users can only see their own).

### PUT `/api/goals/{id}` 🔄🛠

- **Description**: Updates a goal to track progress.

### DELETE `/api/goals/{id}` ❌🗑

- **Description**: Deletes a goal by ID.

## Budget Routes 💰

### POST `/api/budgets` ✍️📝

- **Description**: Creates a new budget for the logged-in user.
- **Request Body**:
    ```json
    {
      "category": "Groceries",
      "amount": 200,
      "startDate": "2025-03-30",
      "endDate": "2025-04-30"
    }
    ```
### GET `/api/budgets` 📄🔍
  
- **Description**: Fetches all budgets for the logged-in user (Admin can see all, users can only see their own).

### PUT `/api/budgets/{id}` 🔄🛠

- **Description**: Updates a budget for the logged-in user (Admin can update any, users can update only their own).

### DELETE `/api/budgets/{id}` ❌🗑

- **Description**: Deletes a budget by ID (Admin can delete any, users can delete only their own).

## User Routes 👥

### GET `/api/users` 📄🔍

- **Description**: Fetches all users (Admin only).

### PUT `/api/users/{id}` 🔄🛠

- **Description**: Updates a user's information (Admin can update all users, regular users can only update their own name and email).

### DELETE `/api/users/{id}` ❌🗑

- **Description**: Deletes a user (Admin only).

## Reports and Savings Routes 📑

### GET `/api/reports/generate` 📄🔍

- **Description**: Generates a report for savings (Admin gets all, regular users only see their own).

### GET `/api/savings` 📄🔍

- **Description**: Fetches all savings for the logged-in user (Admin can see all, regular users only see their own).

### GET `/api/savings/{id}` 📄🔍

- **Description**: Fetches savings by ID (Admin can see any, regular users can only see their own).

### GET `/api/savings/total` 📄🔍

- **Description**: Fetches total savings for the logged-in user (Admin can see all, regular users only see their own).

---

## 📚 Personal Details 

- 👨‍🎓 **Student Name**: Kumarasinghe S.S  
- 🆔 **IT Number**: IT22221414  
- 📧 **Student Email**: IT22221414@my.sliit.lk  
- 🗓️ **Batch**: Y3.S1.WE.SE.01.01

---

[![Review Assignment Due Date](https://classroom.github.com/assets/deadline-readme-button-22041afd0340ce965d47ae6ef1cefeee28c7c493a6346c4f15d667ab976d596c.svg)](https://classroom.github.com/a/xIbq4TFL)
