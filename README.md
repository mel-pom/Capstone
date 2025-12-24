# Client Daily Documentation System

A full-stack web application for managing daily documentation entries for clients. Built with React, Node.js, Express, and MongoDB.

## 🚀 Features

- **User Authentication**: Secure JWT-based authentication with role-based access (Admin/Staff)
- **Client Management**: Create, view, update, and delete client profiles with photo uploads
- **Daily Entries**: Document client activities across multiple categories:
  - Meals
  - Behavior
  - Outings
  - Medical
  - Notes
- **Advanced Filtering**: Filter entries by category, date range, and keyword search
- **Visual Filter Chips**: Quick filter buttons and active filter indicators
- **Responsive Design**: Mobile-friendly interface that works on all devices
- **Delete Confirmations**: Safety dialogs to prevent accidental deletions

## 📋 Tech Stack

### Frontend
- **React 19** - UI library
- **React Router** - Client-side routing
- **Vite** - Build tool and dev server
- **Tailwind CSS** - Utility-first CSS framework
- **Axios** - HTTP client

### Backend
- **Node.js** - Runtime environment
- **Express 5** - Web framework
- **MongoDB** - Database (via Mongoose)
- **JWT** - Authentication tokens
- **bcrypt** - Password hashing

## 🛠️ Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas account (or local MongoDB instance)
- npm or yarn

### Backend Setup

1. Navigate to the server directory:
```bash
cd server
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `server` directory:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key_here
PORT=5000
```

4. Start the development server:
```bash
npm run dev
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. Navigate to the client directory:
```bash
cd client
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `client` directory (optional, defaults to localhost):
```env
VITE_API_BASE=http://localhost:5000
```

4. Start the development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or another port if 5173 is busy)

## 📁 Project Structure

```
client-daily-docs/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/  # Reusable components
│   │   ├── pages/        # Page components
│   │   ├── utils/        # Utility functions
│   │   └── api.js        # API configuration
│   └── package.json
├── server/                # Express backend
│   ├── controllers/      # Route controllers
│   ├── middleware/       # Auth middleware
│   ├── models/           # Mongoose models
│   ├── routes/           # API routes
│   ├── utils/            # Utility functions
│   └── index.js          # Server entry point
└── README.md
```

## 🔐 Authentication & Authorization

- **Registration**: Create new user accounts (defaults to "staff" role)
- **Login**: Authenticate with email and password
- **JWT Tokens**: Stored in localStorage for session management
- **Role-Based Access**:
  - **Admin**: Can create, update, and delete clients
  - **Staff**: Can view clients and create entries

## 📡 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Clients
- `GET /api/clients` - Get all clients (authenticated)
- `GET /api/clients/:id` - Get single client (authenticated)
- `POST /api/clients` - Create client (admin only)
- `PUT /api/clients/:id` - Update client (admin only)
- `DELETE /api/clients/:id` - Delete client (admin only)

### Entries
- `GET /api/entries/client/:clientId` - Get entries for a client (with filters)
- `POST /api/entries` - Create new entry (authenticated)
- `PUT /api/entries/:id` - Update entry (authenticated)
- `DELETE /api/entries/:id` - Delete entry (authenticated)

## Future Improvements
- Dashboard advancements for seeing patterns within reported data
- Export data and create custom report templates for clean pdf report output
- Application theme settings
- Refine data entry for more customized reporting for individual client needs
