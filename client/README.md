# Gym CRM - Frontend

This is the frontend application for the Gym CRM system, built with React and Material-UI.

## Features

- Modern, responsive UI built with Material-UI components
- State management using React Context API
- JWT authentication with protected routes
- Role-based access control (admin, manager, staff, trainer)
- Dashboard with statistics and quick actions
- Comprehensive management interfaces for:
  - Members
  - Memberships
  - Payments
  - Attendance
  - Classes
  - Staff
  - Users

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
# or
yarn install
```

2. Start the development server:
```bash
npm start
# or
yarn start
```

The application will be available at http://localhost:3000

## Project Structure

```
client/
├── public/              # Static files
├── src/
│   ├── components/      # React components
│   │   ├── auth/        # Authentication components
│   │   ├── dashboard/   # Dashboard components
│   │   ├── layout/      # Layout components (navbar, sidebar)
│   │   ├── members/     # Member management components
│   │   ├── memberships/ # Membership management components
│   │   ├── payments/    # Payment management components
│   │   ├── attendance/  # Attendance management components
│   │   ├── classes/     # Class management components
│   │   ├── staff/       # Staff management components
│   │   ├── users/       # User management components
│   │   └── routing/     # Routing components
│   ├── context/         # Context API state management
│   │   ├── auth/        # Authentication context
│   │   ├── alert/       # Alert context
│   │   └── types.js     # Action type definitions
│   ├── utils/           # Utility functions
│   ├── App.js           # Main application component
│   └── index.js         # Entry point
└── package.json         # Dependencies and scripts
```

## Authentication

The application uses JWT (JSON Web Tokens) for authentication. The token is stored in localStorage and included in the headers of API requests. Protected routes require authentication, and certain features are restricted based on user roles.

## Available Scripts

- `npm start` - Starts the development server
- `npm build` - Builds the app for production
- `npm test` - Runs tests
- `npm eject` - Ejects from create-react-app

## Default Login

When the backend is properly set up with the initialization script, you can log in with:

- Email: admin@gymcrm.com
- Password: admin123

**Important:** Change this password after the first login for security reasons.
