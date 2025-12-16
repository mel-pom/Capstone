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

## 🚢 Deployment

### Backend (Render)

1. Push your code to GitHub
2. Create a new Web Service on Render
3. Connect your repository
4. Configure:
   - **Build Command**: `cd server && npm install`
   - **Start Command**: `cd server && node index.js`
   - **Environment Variables**:
     - `MONGO_URI` - Your MongoDB connection string
     - `JWT_SECRET` - Your JWT secret
     - `PORT` - Will be set automatically by Render

### Frontend (Vercel)

1. Push your code to GitHub
2. Import project in Vercel
3. Configure:
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Environment Variables**:
     - `VITE_API_BASE` - Your deployed backend URL (e.g., `https://your-app.onrender.com`)

See deployment configuration files in the project root for more details.

## 🧪 Testing

Test the API endpoints using Postman or similar tools:

1. Register a new user at `POST /api/auth/register`
2. Login at `POST /api/auth/login` to get a JWT token
3. Use the token in the `Authorization: Bearer <token>` header for protected routes

## 📝 Notes

- Client photos are stored as base64 strings in the database (max 2MB)
- All timestamps are automatically managed by Mongoose
- The application uses JWT tokens stored in localStorage
- CORS is enabled for cross-origin requests

## 🐛 Troubleshooting

### MongoDB Connection Issues
- Verify your `MONGO_URI` is correct
- Check that your IP is whitelisted in MongoDB Atlas
- Ensure the connection string includes authentication credentials

### CORS Errors
- Ensure the backend CORS configuration allows your frontend origin
- Check that `VITE_API_BASE` matches your backend URL

### Authentication Issues
- Verify JWT_SECRET is set in backend environment
- Check that tokens are being stored in localStorage
- Ensure Authorization headers are being sent with requests

## 📄 License

ISC

## 👤 Author

Capstone Project

