# JSS 2 Class Portal - React Project Structure

## Clean React Architecture

All files are now properly organized with `.jsx` extensions for React components and unnecessary vanilla JavaScript utilities removed.

### Directory Structure

```
src/
├── index.jsx                 # React app entry point
├── App.jsx                   # Main app with router
├── styles.css               # Global CSS imports
├── components/              # Reusable React components
│   ├── Navbar.jsx          # Navigation bar with exam timer
│   ├── Sidebar.jsx         # Role-based sidebar menu
│   ├── Modal.jsx           # Reusable modal component
│   └── ProtectedRoute.jsx  # Route protection wrapper
├── contexts/                # React Context providers
│   ├── AuthContext.jsx      # Authentication state
│   └── DataContext.jsx      # Global data management
├── pages/                   # Page components
│   ├── LoginPage.jsx       # Login page
│   ├── student/            # Student pages (5 files)
│   │   ├── Dashboard.jsx
│   │   ├── Exams.jsx       # Exam list
│   │   ├── ExamActive.jsx  # Active exam with timer
│   │   ├── ExamResults.jsx # Results review
│   │   ├── Grades.jsx
│   │   ├── Assignments.jsx
│   │   ├── Announcements.jsx
│   │   └── Profile.jsx
│   └── teacher/            # Teacher pages (7 files)
│       ├── Dashboard.jsx
│       ├── Exams.jsx
│       ├── Students.jsx
│       ├── Grades.jsx
│       ├── Assignments.jsx
│       └── Announcements.jsx
├── utils/                   # Utility functions
│   ├── storage.js          # localStorage helpers
│   └── mockData.js         # Mock data & API simulation
└── css/                     # Styling (13 files)
    ├── variables.css       # CSS custom properties
    ├── index.css          # Global styles
    ├── auth.css           # Login styling
    ├── navbar.css         # Navbar styling
    ├── sidebar.css        # Sidebar styling
    ├── dashboard.css      # Dashboard styling
    ├── grades.css         # Grades page styling
    ├── assignments.css    # Assignments styling
    ├── announcements.css  # Announcements styling
    ├── profile.css        # Profile styling
    ├── modal.css          # Modal styling
    ├── exam.css           # Exam system styling
    └── responsive.css     # Mobile responsive design
```

## What Was Changed

### Removed (Vanilla JS Utilities - No Longer Needed)
- `src/js/` directory - entire vanilla JavaScript implementation
- `dom.js` - React handles DOM manipulation
- `validators.js` - validation moved to components
- `session.js` - session state in React Context
- `router.js` - React Router v7 replaces manual routing
- `auth.js` - authentication in AuthContext
- `main.js` - React entry point replaces this
- `api.js` - API logic in DataContext

### Kept (Essential Utilities)
- `storage.js` - localStorage helper functions
- `mockData.js` - Mock data and simulated API endpoints

## React Architecture Benefits

### State Management
- **AuthContext**: Manages login, JWT tokens, user info
- **DataContext**: Handles all data operations (CRUD)
- Custom hooks for easy component integration

### Component Structure
- Functional components with hooks
- Reusable components (Navbar, Sidebar, Modal)
- Page components for routing
- Clear separation of concerns

### Routing
- React Router v7 with client-side navigation
- Protected routes for authenticated pages
- Clean URL structure without hash-based routing

### Styling
- Plain CSS (no Tailwind) - all 13 CSS files organized
- CSS variables for theming and consistency
- Component-scoped styles
- Mobile-first responsive design

## Key Features Working

### Authentication
- Login with role selection (Student/Teacher)
- JWT token storage and management
- Protected routes with auto-redirect

### Exam System (CBT)
- Live countdown timer (MM:SS format)
- One question per page MCQ format
- Auto-save answers
- Instant auto-grading
- Answer review with color-coded results

### Data Persistence
- localStorage for data storage
- Mock API simulation
- CRUD operations for all features

### Student Features
- Dashboard with scores and announcements
- My Grades with CSS bar charts
- Assignments with PDF submission
- Announcements with tabs
- Profile with Cloudinary uploads
- **Exams with live timer**

### Teacher Features
- Dashboard with class statistics
- Student management and search
- Grade management
- Assignment creation and management
- Announcement posting
- **Exam creation and results analysis**

## File Format Standards

- All React components: `.jsx` extension
- Utility files: `.js` extension (no JSX)
- Styles: `.css` extension
- One component per file (except utilities)
- Descriptive PascalCase names for components
- Organized in feature-based folders

## Getting Started

1. **Install dependencies**: `pnpm install`
2. **Start dev server**: `pnpm dev`
3. **Login with demo account**:
   - Student: `student@school.com` / `password123`
   - Teacher: `teacher@school.com` / `password123`

## Development

All React best practices are followed:
- Hooks for state and side effects
- Context for global state
- Component composition
- Proper error boundaries
- Responsive design patterns
