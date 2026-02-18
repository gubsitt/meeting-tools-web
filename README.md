# Meeting Tools Web - Exzy

Modern meeting management platform built with Vite + React, featuring a sleek Metropolis-inspired design.

## 🚀 Features

- 🔐 **Google OAuth Authentication** - Secure login with Google
- 👥 **User Management** - Admin dashboard for managing users and roles
- 🎨 **Modern UI/UX** - Sleek, responsive design with smooth animations
- 🌙 **Dark Theme** - Eye-friendly dark mode with gradient accents
- ⚡ **Fast Performance** - Built with Vite for optimal speed
- 🔒 **Role-Based Access** - User and Admin roles with protected routes

## 🛠️ Tech Stack

- **Frontend**: React 18 + Vite
- **Routing**: React Router DOM v6
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **HTTP Client**: Axios
- **Styling**: Custom CSS with CSS Variables

## 📦 Installation

1. **Clone the repository**
```bash
cd meeting-tools-web
```

2. **Install dependencies**
```bash
npm install
```

3. **Configure environment variables**
```bash
cp .env.example .env
```

Edit `.env` and add your configuration:
```env
VITE_API_URL=http://localhost:5000
VITE_GOOGLE_CLIENT_ID=your_google_client_id_here
```

4. **Start development server**
```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## 🎨 Design System

### Color Palette
- **Primary**: `#6C5CE7` (Purple)
- **Secondary**: `#00CEC9` (Cyan)
- **Accent**: `#FD79A8` (Pink)
- **Success**: `#00B894` (Green)
- **Warning**: `#FDCB6E` (Yellow)
- **Error**: `#FF7675` (Red)

### Typography
- **Primary Font**: Inter
- **Heading Font**: Space Grotesk

## 📁 Project Structure

```
meeting-tools-web/
├── public/
├── src/
│   ├── config/
│   │   └── constants.js          # Centralized configuration & constants
│   ├── styles/
│   │   ├── pages/                # Page-specific stylesheets
│   │   └── components/           # Component-specific stylesheets
│   ├── utils/
│   │   └── formatters.js         # Utility functions for formatting
│   ├── components/
│   │   ├── Layout.jsx
│   │   ├── Sidebar.jsx
│   │   ├── Loading.jsx
│   │   ├── Pagination.jsx
│   │   ├── UserEventModal.jsx
│   │   ├── CalendarEventModal.jsx
│   │   └── CancelledEventModal.jsx
│   ├── context/
│   │   └── AuthContext.jsx       # Authentication context provider
│   ├── hooks/
│   │   ├── usePagination.js      # Pagination logic
│   │   ├── useUserSearch.js      # User search with debounce
│   │   ├── useMobileFilter.js    # Mobile filter toggle
│   │   ├── useDateRangeFilter.js # Date range filtering
│   │   └── useSearchFilter.js    # Generic search filter
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Calendar.jsx
│   │   ├── UserEvents.jsx
│   │   ├── CancelledEvents.jsx
│   │   ├── MissSyncEvents.jsx
│   │   ├── UserManagement.jsx
│   │   └── ConfigFile.jsx
│   ├── services/
│   │   ├── api.js                # Axios instance & base config
│   │   ├── CalendarService.js
│   │   ├── UserEventService.js
│   │   ├── CancelledEventService.js
│   │   ├── MissSyncService.js
│   │   └── ConfigFileService.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css                 # Global styles
├── .env.example                  # Environment variables template
├── index.html
├── vite.config.js
├── package.json
└── README.md
```

## 🔑 Authentication Flow

1. User clicks "Continue with Google"
2. Redirects to backend Google OAuth
3. Backend handles authentication
4. Sets JWT token in httpOnly cookie
5. Redirects back to dashboard based on role
6. Frontend fetches user data and renders appropriate dashboard

## 🛡️ Protected Routes

- `/login` - Public (redirects if authenticated)
- `/dashboard` - Protected (requires authentication)
- `/admin/dashboard` - Protected (requires admin role)

## 🎯 API Integration

The frontend communicates with the backend API through Axios with the following endpoints:

- `GET /api/auth/me` - Get current user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/users` - Get all users (Admin only)
- `PUT /api/auth/users/:userId/role` - Update user role (Admin only)
- `DELETE /api/auth/users/:userId` - Delete user (Admin only)

## 🚀 Build for Production

```bash
npm run build
```

The production build will be in the `dist` folder.

## 🔧 Backend Requirements

This frontend requires a Node.js/Express backend with:
- Google OAuth 2.0 configured
- JWT authentication
- User model with roles
- CORS enabled for frontend URL
- Cookie-based session management

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop (1920px+)
- Laptop (1366px)
- Tablet (768px)
- Mobile (375px)

## 🎭 Features by Role

### User Dashboard
- View meeting statistics
- Browse upcoming meetings
- Quick actions for common tasks
- Profile management

### Admin Dashboard
- User management table
- Role assignment
- User deletion
- Search and filter capabilities
- Pagination

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License.

## 👨‍💻 Author

Exzy Team

## 🙏 Acknowledgments

- Google OAuth for authentication
- Framer Motion for animations
- Lucide React for beautiful icons
- Inter & Space Grotesk fonts
