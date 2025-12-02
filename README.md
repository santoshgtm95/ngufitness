# 🏋️ NGU Fitness Membership Management System

A full-stack web application for managing gym memberships with customer registration, membership tracking, and automatic expiration alerts.

## 🚀 Features

- **Customer Management**: Register and manage customer information (name, phone, address)
- **Membership Tracking**: Create and update memberships with various package types
- **Expiration Alerts**: Automatic alerts for memberships expiring within 5 days
- **Modern UI**: Dark theme with glassmorphism effects and smooth animations
- **Full-Stack**: MySQL database with Node.js/Express REST API

## 📋 Package Types

- 1 Day
- 15 Days
- 1 Month
- 6 Months
- 1 Year

## 🛠️ Tech Stack

**Frontend:**
- HTML5, CSS3, Vanilla JavaScript
- Modern responsive design
- Fetch API for backend communication

**Backend:**
- Node.js with Express
- MySQL database
- RESTful API architecture

## 📦 Prerequisites

- Node.js (v14 or higher)
- MySQL (v5.7 or higher)
- npm or yarn

## 🔧 Installation

### 1. Install MySQL (macOS)

```bash
# Install MySQL using Homebrew
brew install mysql

# Start MySQL service
brew services start mysql

# Secure MySQL installation (optional but recommended)
mysql_secure_installation
```

### 2. Create Database and User

```bash
# Login to MySQL as root
mysql -u root -p

# Run the following SQL commands:
```

```sql
-- Create database
CREATE DATABASE gym_membership;

-- Create user (replace 'your_password' with a secure password)
CREATE USER 'gym_admin'@'localhost' IDENTIFIED BY 'your_password';

-- Grant privileges
GRANT ALL PRIVILEGES ON gym_membership.* TO 'gym_admin'@'localhost';
FLUSH PRIVILEGES;

-- Exit MySQL
EXIT;
```

### 3. Set Up Database Schema

```bash
# Navigate to backend directory
cd backend

# Run schema file
mysql -u gym_admin -p gym_membership < database/schema.sql
```

### 4. Install Backend Dependencies

```bash
# In the backend directory
npm install
```

### 5. Configure Environment Variables

```bash
# Copy the example env file
cp .env.example .env

# Edit .env file with your database credentials
nano .env
```

Update the `.env` file:
```env
DB_HOST=localhost
DB_USER=gym_admin
DB_PASSWORD=your_password_here
DB_NAME=gym_membership
DB_PORT=3306

PORT=3000
NODE_ENV=development

FRONTEND_URL=http://localhost:8080
```

## 🚀 Running the Application

### Start the Backend Server

```bash
# In the backend directory
npm start

# For development with auto-reload
npm run dev
```

The API server will start on `http://localhost:3000`

### Start the Frontend

You can use any static file server. Here are a few options:

**Option 1: Using Python (if installed)**
```bash
# In the project root directory
python3 -m http.server 8080
```

**Option 2: Using Node.js http-server**
```bash
# Install http-server globally
npm install -g http-server

# In the project root directory
http-server -p 8080
```

**Option 3: Using VS Code Live Server**
- Install the "Live Server" extension
- Right-click on `index.html` and select "Open with Live Server"

The frontend will be available at `http://localhost:8080`

## 📡 API Endpoints

### Customers

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/customers` | Get all customers with memberships |
| GET | `/api/customers/:id` | Get single customer |
| POST | `/api/customers` | Create new customer |
| PUT | `/api/customers/:id` | Update customer |
| DELETE | `/api/customers/:id` | Delete customer |

### Memberships

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/memberships` | Get all memberships |
| GET | `/api/memberships/expiring` | Get memberships expiring in 5 days |
| POST | `/api/memberships` | Create/update membership |
| DELETE | `/api/memberships/:id` | Delete membership |

## 🗂️ Project Structure

```
NGU/
├── index.html              # Frontend HTML
├── styles.css              # Frontend styles
├── app.js                  # Frontend JavaScript (API client)
├── .gitignore             # Git ignore file
├── README.md              # This file
└── backend/
    ├── server.js          # Express server
    ├── package.json       # Node.js dependencies
    ├── .env.example       # Environment template
    ├── .env               # Environment config (create this)
    ├── config/
    │   └── database.js    # Database connection
    ├── routes/
    │   ├── customers.js   # Customer API routes
    │   └── memberships.js # Membership API routes
    ├── middleware/
    │   └── errorHandler.js # Error handling
    └── database/
        └── schema.sql     # Database schema
```

## 🧪 Testing the Application

1. **Start both servers** (backend and frontend)
2. **Open the application** in your browser at `http://localhost:8080`
3. **Add a customer**: Click "Add Customer" and fill in the form
4. **Register membership**: After saving a customer, the membership modal will open automatically
5. **View alerts**: Check the left sidebar for expiration alerts
6. **Test search**: Use the search box to filter customers

## 🔒 Production Deployment

### Environment Configuration

For production, update your `.env` file:

```env
NODE_ENV=production
DB_HOST=your_production_db_host
DB_USER=your_production_db_user
DB_PASSWORD=your_secure_production_password
FRONTEND_URL=https://your-domain.com
```

### Security Recommendations

1. Use strong database passwords
2. Enable HTTPS for production
3. Set up proper CORS configuration
4. Use environment variables for all sensitive data
5. Regular database backups
6. Keep dependencies updated

### Deployment Options

- **Backend**: Deploy to services like Heroku, DigitalOcean, AWS, or Railway
- **Database**: Use managed MySQL services like AWS RDS, Google Cloud SQL, or PlanetScale
- **Frontend**: Deploy to Netlify, Vercel, or any static hosting service

## 🐛 Troubleshooting

### Backend won't start

- Check if MySQL is running: `brew services list`
- Verify database credentials in `.env`
- Ensure database exists: `mysql -u gym_admin -p -e "SHOW DATABASES;"`

### Frontend can't connect to backend

- Verify backend is running on port 3000
- Check CORS configuration in `server.js`
- Ensure `API_BASE_URL` in `app.js` matches your backend URL

### Database connection errors

- Verify MySQL service is running
- Check database credentials
- Ensure database schema is created: Run `schema.sql`

## 📝 License

ISC

## 👨‍💻 Support

For issues or questions, please check the troubleshooting section above.
