# e-Granthalaya - Digital Library Management System

A full-stack MVC library management system built with Node.js backend and vanilla JavaScript frontend.

## 🌟 Features

- **Admin Panel**: Book management, student tracking, borrowing records
- **Student Portal**: Browse books, borrow/return, view history
- **Real-time Sync**: Books sync across all users automatically
- **Secure Authentication**: Encrypted passwords, session management
- **Department-wise Organization**: Computer Science, Mechanical, Mining

## 🚀 Live Demo

- **Frontend**: [https://your-app.vercel.app](https://your-app.vercel.app)
- **Backend API**: [https://your-backend.railway.app](https://your-backend.railway.app)

## 📋 Prerequisites

- Node.js (v14 or higher)
- Git

## 🛠️ Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/e-granthalaya.git
cd e-granthalaya
```

### 2. Install dependencies

```bash
cd backend
npm install
```

### 3. Start the backend server

```bash
node server-simple.js
```

Server runs on `http://localhost:3000`

### 4. Access the application

- **Main Page**: http://localhost:3000
- **Admin Login**: http://localhost:3000/admin-login.html (Password: 112233)
- **Student Login**: http://localhost:3000/student-login.html

## 📁 Project Structure

```
e-granthalaya-main/
├── e-granthalaya-main/        # Frontend files
│   ├── index.html
│   ├── admin-dashboard.html
│   ├── student-dashboard.html
│   ├── css/
│   ├── js/
│   │   ├── api.js            # API client
│   │   ├── api-bridge.js     # Auto-sync
│   │   ├── app.js
│   │   └── ...
│   └── assets/
├── backend/                   # Backend server
│   ├── server-simple.js      # Main server
│   └── package.json
└── README.md
```

## 🔑 Default Credentials

**Admin:**
- Password: `112233`

**Student:**
- Register your own account at student-login.html

## 🌐 Deployment

### Deploy Backend (Railway/Render)

1. Create account on [Railway.app](https://railway.app) or [Render.com](https://render.com)
2. Create new project from GitHub repo
3. Set root directory to `backend`
4. Set build command: `npm install`
5. Set start command: `node server-simple.js`
6. Deploy!

### Deploy Frontend (Vercel/Netlify)

1. Create account on [Vercel](https://vercel.com) or [Netlify](https://netlify.com)
2. Import GitHub repository
3. Set root directory to `e-granthalaya-main`
4. Deploy!
5. Update `js/api.js` with your backend URL

## 📝 API Endpoints

- `POST /api/auth/admin/login` - Admin authentication
- `POST /api/auth/student/register` - Student registration
- `POST /api/auth/student/login` - Student authentication
- `GET /api/books` - Get all books
- `POST /api/books` - Add new book
- `POST /api/borrow` - Borrow a book
- `GET /api/borrow/all` - Get borrowing history

## 🎯 Features in Detail

### For Students:
- Browse department-specific books
- Preview book details
- Borrow and return books
- Track borrowing history
- Auto-sync book updates

### For Admins:
- Add/edit/delete books
- View all students
- Track all borrowing records
- Manage book inventory
- Department-wise organization

## 🔒 Security

- Passwords hashed using SHA-256
- Session-based authentication
- CORS enabled for API
- Input validation

## 🛣️ Roadmap

- [ ] PDF upload support
- [ ] SQLite database persistence
- [ ] Email notifications
- [ ] Advanced search & filters
- [ ] Book reservations
- [ ] Due date reminders

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 👨‍💻 Author

Your Name

## 🙏 Acknowledgments

Built for School of Mines Digital Library Management
