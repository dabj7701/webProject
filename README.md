# Skin folio - Skin Inventory Manager

**Frontend**

- Written in JavaScript, HTML and CSS
- Architecture relies on a state management system (setPageState) for DOM manipulation
- All client-server communication is handled asynchronously using fetch API
- UI feedback is provided for success, error and load states

**Backend**

- Built with Node.js and Express.js
- Implements secure RESTful API endpoints for all CRUD operations
- User authentication is handeld securely using bcrypt for hashing the passwords
- Strict error handling ensures the server responds with appropriate HTTP status

**Database**

- MariaDB database accessed via a connection pool
- Uses parameterized queries to prevent SQL injections
- try, catch and finally blocks are implemented to ensure safe release of database connections

## Database Structure

- **Users:** Stores user information
  - id(PK), username(Unique), password(Hashed), role(user or admin)
- **Categories:** Stores all the available categories
  - id(PK), name(Unique)
- **Skins:** The primary inventory items
  - id(PK), name, price, user_id(FK -> Users), category(FK -> Categories)

## Setup Instructions

### Needed Software

- Node.js installed
- Docker installed (For MariaDB container)

### Database Setup

The databas is fully containerized using Docker and MariaDB

When running `docker compose up -d`, the database container is automatically initialized

### Installation & Execution

**Install dependencies:**

- Open your terminal in the project folder and run:
  `npm install`

**Environment Variables (.env):**

- Create a `.env` file in the root directory and add your configuration variables. For example:

```env
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=1234
DB_NAME=skinfolio
```

**Start the database:**

- Start the MariaDB container (this automatically executes setup.sql):
  `docker compose up -d`

**Start the server:**

- `node server.js`

**Access the application:**

- Open a web browser and navigate to: `http://localhost:3000`
