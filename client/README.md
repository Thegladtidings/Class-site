# JSS 2 Class Portal

A comprehensive class management web application built with **vanilla JavaScript** (no React), plain CSS, and Vite. The portal supports two user roles: **Student** and **Teacher**, with full authentication, assignment management, grade tracking, and announcements.

## 🎯 Features

### Student Features
- **Dashboard**: Welcome banner, score summary cards, pinned announcements, next assignment
- **My Grades**: Interactive CSS bar chart showing subject averages, color-coded grade table (green/amber/red)
- **Assignments**: View active and past assignments, submit PDF documents to Cloudinary
- **Announcements**: Tabbed view by type (Notice, Spotlight, Result, Event)
- **Profile**: Upload profile photo to Cloudinary, change email, update password
- **Exams (CBT)**: Take scheduled exams with live countdown timer, one question per page, instant results with answer review

### Teacher Features
- **Dashboard**: Class statistics, top performer card, student performance overview table
- **Students**: Searchable and sortable student directory with average scores
- **Grade Management**: Modal form to upload grades (student, week, topic, score, remarks)
- **Assignments**: Post assignments with title/subject/description/due date, manage status (active/closed/reopen), delete
- **Announcements**: Post notices, spotlight announcements with student selector, result releases, events, pin/unpin/delete
- **Exams (CBT)**: Create scheduled exams, manage question banks, view detailed results dashboard with class statistics

## 🛠️ Tech Stack

- **Frontend**: Vanilla JavaScript (ES6+)
- **Build Tool**: Vite
- **Styling**: Plain CSS with CSS variables
- **Storage**: localStorage (mock data persistence)
- **File Upload**: Cloudinary
- **HTTP Client**: Axios (with custom mock interceptor for API simulation)
- **Routing**: Hash-based client-side router

## 📁 Project Structure

```
src/
├── js/
│   ├── main.js                 # App entry point & router setup
│   ├── auth.js                 # Authentication module
│   ├── api.js                  # Mock API with Axios instance
│   ├── router.js               # Client-side router
│   ├── config.js               # Configuration constants
│   ├── mockData.js             # Initial data & CRUD operations
│   ├── components/
│   │   ├── navbar.js           # Navbar component
│   │   └── sidebar.js          # Sidebar component
│   ├── pages/
│   │   ├── login.js            # Login page
│   │   ├── student/
│   │   │   ├── dashboard.js
│   │   │   ├── grades.js
│   │   │   ├── assignments.js
│   │   │   ├── announcements.js
│   │   │   ├── profile.js
│   │   │   ├── exams.js        # Exam list page
│   │   │   ├── exam-active.js  # Active exam taking
│   │   │   └── exam-results.js # Results review
│   │   └── teacher/
│   │       ├── dashboard.js
│   │       ├── students.js
│   │       ├── grades.js
│   │       ├── assignments.js
│   │       ├── announcements.js
│   │       ├── exams.js        # Exam management
│   │       ├── exam-questions.js # Question editor
│   │       └── exam-results.js # Results dashboard
│   └── utils/
│       ├── storage.js          # localStorage helpers
│       ├── dom.js              # DOM manipulation utilities
│       ├── validators.js       # Form validation
│       ├── cloudinary.js       # Cloudinary upload utilities
│       └── session.js          # Exam session management
├── css/
│   ├── variables.css           # CSS custom properties
│   ├── index.css               # Global styles
│   ├── auth.css
│   ├── navbar.css
│   ├── sidebar.css
│   ├── modal.css
│   ├── dashboard.css
│   ├── grades.css
│   ├── assignments.css
│   ├── announcements.css
│   ├── profile.css
│   ├── exam.css                # CBT exam styling
│   └── responsive.css
├── index.html                  # Main HTML template
└── vite.config.js             # Vite configuration
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

The app will be available at `http://localhost:5173`

## 🔐 Authentication

### Demo Credentials

**Student Account:**
- Email: `student@school.com`
- Password: `password123`

**Teacher Account:**
- Email: `teacher@school.com`
- Password: `password123`

### How Authentication Works

1. Login form accepts email, password, and role selection
2. Credentials are validated against mock user data in localStorage
3. JWT token is generated and stored in localStorage
4. Axios interceptor automatically attaches token to all API requests
5. 401 responses trigger logout and redirect to login page
6. User role determines which pages are accessible (Student vs Teacher)

## 🗂️ Data Persistence

All data is stored in **localStorage** using a mock API system:

- **jss_students**: Student profiles
- **jss_teachers**: Teacher profiles
- **jss_assignments**: Assignment data
- **jss_grades**: Grade records
- **jss_announcements**: Announcements
- **jss_submissions**: Assignment submissions
- **jss_users**: User credentials (email & password)
- **jss_auth_token**: JWT token
- **jss_auth_user**: Current user info
- **jss_auth_role**: User role

## 📤 File Uploads

### Cloudinary Integration

Profile photos and PDF assignments are uploaded to Cloudinary using **unsigned uploads**:

**To enable file uploads:**

1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com)
2. Update `src/js/config.js` with your credentials:

```javascript
export const CLOUDINARY_CONFIG = {
  CLOUD_NAME: 'your-cloud-name',
  UPLOAD_PRESET_IMAGES: 'your-unsigned-preset-images',
  UPLOAD_PRESET_DOCUMENTS: 'your-unsigned-preset-documents',
};
```

3. Create two unsigned upload presets in Cloudinary Dashboard:
   - One for images (profile photos)
   - One for documents (PDF assignments)

Without valid Cloudinary credentials, file uploads will fail gracefully with error messages.

## 🎨 Styling

### Design System

The application uses a professional color scheme with CSS variables:

- **Primary**: Navy blue (#1e3a5f)
- **Accent**: Orange (#ff6b35)
- **Success**: Green (#4caf50)
- **Warning**: Amber (#ffc107)
- **Danger**: Red (#f44336)

All styles are in **plain CSS** with:
- No utilities-first approach (no Tailwind)
- Semantic class names
- Mobile-first responsive design
- CSS Grid and Flexbox layouts
- CSS variables for theming

### Responsive Design

- **Mobile**: < 480px
- **Tablet**: 481px - 768px
- **Desktop**: 769px+
- **Large**: 1025px - 1440px
- **Extra Large**: 1441px+

## 🔄 Client-Side Routing

The application uses **hash-based routing** (single-page application):

Routes follow the pattern: `#/role/page`

**Student Routes:**
- `#/login` - Login page
- `#/student/dashboard` - Student dashboard
- `#/student/grades` - My grades
- `#/student/assignments` - Assignments
- `#/student/announcements` - Announcements
- `#/student/profile` - Profile page

**Teacher Routes:**
- `#/teacher/dashboard` - Class dashboard
- `#/teacher/students` - Student directory
- `#/teacher/grades` - Grade management
- `#/teacher/assignments` - Assignment management
- `#/teacher/announcements` - Announcement management

## 📊 Mock API System

The `api.js` module provides an Axios-like interface with:

- Request/response interceptors
- Mock API endpoints
- localStorage-based data persistence
- Simulated network delays (300ms)
- Promise-based async operations

Supported endpoints:
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/students`
- `POST /api/students`
- `GET /api/assignments`
- `POST /api/assignments`
- `PUT /api/assignments/:id`
- `DELETE /api/assignments/:id`
- `GET /api/announcements`
- `POST /api/announcements`
- `PUT /api/announcements/:id`
- `DELETE /api/announcements/:id`
- `GET /api/grades`
- `POST /api/grades`
- `POST /api/submissions/:assignmentId`

## 🎯 Key Components

### navbar.js
- Navigation bar with user dropdown
- Mobile menu toggle
- Logout button
- User profile link

### sidebar.js
- Role-specific navigation menu
- Active link highlighting
- Mobile-responsive drawer
- Quick navigation to all pages

### Modal System
- Generic modal component
- Overlay backdrop
- Close button and actions
- Used for forms (grades, announcements, assignments)

### Charts & Data Visualization
- CSS bar chart for grades (height-based bars)
- Color-coded score badges
- Statistics cards with icons
- Sortable/searchable tables

## 🛡️ Security Notes

This is a **demo application** with mock security:

- Passwords are stored in plain text (use proper hashing in production)
- JWT tokens are simple random strings (use proper JWT in production)
- No server-side validation (implement in production)
- localStorage has no encryption (use secure storage in production)
- Cloudinary unsigned uploads should have proper restrictions

**For production:**
- Use a real backend with proper authentication
- Hash passwords with bcrypt or similar
- Implement proper JWT with expiration
- Use HTTPS only
- Add server-side validation
- Implement rate limiting
- Use secure session management

## 📝 Development

### Adding New Pages

1. Create a page module in `src/js/pages/`
2. Export an object with `render()` and `init()` methods
3. Register the route in `main.js`
4. Add navigation links in navbar/sidebar

### Adding New Features

1. Update mockData.js with new data structures
2. Add API endpoints in api.js
3. Create page modules or components
4. Add CSS styles in appropriate files
5. Attach event listeners in init() methods

### Browser DevTools

- Use console for debugging (includes `[v0]` prefixed logs)
- Inspect Network tab to see mock API "requests"
- Check Application → localStorage to see persisted data
- Use responsive design mode to test mobile layouts

## 📱 Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## 🤝 Contributing

To extend this project:

1. Follow the existing file structure
2. Use semantic HTML and CSS class names
3. Add comments for complex logic
4. Test on multiple screen sizes
5. Update this README with new features

## 📄 License

This project is open source and available for educational purposes.

## 📞 Support

For issues or questions:
1. Check the console for error messages
2. Verify Cloudinary configuration
3. Clear localStorage if data seems corrupted
4. Check browser compatibility

---

**Built with ❤️ using Vanilla JavaScript, Plain CSS, and Vite**
