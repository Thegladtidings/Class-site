# React Conversion - JSS 2 Class Portal

## Overview

The JSS 2 Class Portal has been successfully converted from vanilla JavaScript to **React 19** with the following architecture:

- **Framework**: React 19.2.5 with React Router v7
- **Build Tool**: Vite with hot module replacement
- **State Management**: React Context API + Custom Hooks
- **Styling**: Plain CSS (all previous styles preserved)
- **Authentication**: JWT-based with localStorage persistence
- **Data**: Mock API system with localStorage

## Project Structure

```
src/
├── index.jsx                 # React entry point
├── App.jsx                   # Main app with routing
├── components/
│   ├── Navbar.jsx           # Top navigation with exam timer
│   ├── Sidebar.jsx          # Side navigation
│   ├── Modal.jsx            # Reusable modal component
│   └── ProtectedRoute.jsx   # Route protection HOC
├── contexts/
│   ├── AuthContext.jsx      # Authentication state
│   └── DataContext.jsx      # Data management
├── pages/
│   ├── LoginPage.jsx        # Login page
│   ├── student/
│   │   ├── Dashboard.jsx
│   │   ├── Grades.jsx
│   │   ├── Assignments.jsx
│   │   ├── Announcements.jsx
│   │   ├── Profile.jsx
│   │   ├── Exams.jsx        # Exam listing page
│   │   ├── ExamActive.jsx   # Active exam with timer
│   │   └── ExamResults.jsx  # Results review
│   └── teacher/
│       ├── Dashboard.jsx
│       ├── Students.jsx
│       ├── Grades.jsx
│       ├── Assignments.jsx
│       ├── Announcements.jsx
│       └── Exams.jsx        # Teacher exam management
├── utils/
│   ├── storage.js           # localStorage utilities
│   └── mockData.js          # Mock data & API functions
└── css/                      # All original CSS files preserved
```

## Key Features Implemented

### Authentication (AuthContext)
- Login page with role selection (Student/Teacher)
- JWT token stored in localStorage
- User context with login/logout functionality
- Protected routes that check authentication and role

### Data Management (DataContext)
- Centralized data management for exams, grades, assignments, announcements
- All CRUD operations wrapped in custom hooks
- Easy access via `useData()` hook in components

### Exam System (CBT)
- **Exams List Page**: Browse available, upcoming, and past exams
- **Active Exam Page**: 
  - One question per page display
  - Live countdown timer in navbar (HH:MM:SS)
  - Timer color changes: Green (>5 min) → Yellow (5-15 min) → Red (<5 min)
  - Previous/Next question navigation
  - Auto-save answers to localStorage
  - Confirmation modal before submission
- **Results Page**:
  - Score circle with percentage and pass/fail status
  - Summary statistics (total, correct, incorrect)
  - Detailed answer review table with color-coded results

### Navigation
- React Router v7 for client-side routing
- Sidebar navigation with links for each role
- Responsive mobile menu
- Dynamic navbar with profile dropdown

### Reusable Components
- **Navbar**: Title, profile menu, exam timer display
- **Sidebar**: Navigation links based on user role
- **Modal**: Generic modal with overlay and close button
- **ProtectedRoute**: Authentication and role-based route protection

## How to Use

### Login
1. Visit `http://localhost:5173/`
2. Default credentials:
   - Student: `student@school.com` / `password123`
   - Teacher: `teacher@school.com` / `password123`

### Student Flow - Taking an Exam
1. Navigate to **Exams** from sidebar
2. Click **Start Exam** on an active exam
3. Answer questions one per page using Previous/Next buttons
4. Watch the timer in the navbar update in real-time
5. Click **Submit Exam** on the last question
6. View instant results with answer review

### Using Contexts

```jsx
// In any component:
import { useAuth } from '../contexts/AuthContext';
import { useData } from '../contexts/DataContext';

function MyComponent() {
  const { state, login, logout } = useAuth();
  const { getExams, submitExam } = useData();
  
  // Use in component logic...
}
```

## CSS Architecture

All original CSS files are preserved and imported in `src/index.jsx`:

- `variables.css`: Color palette and design tokens
- `index.css`: Global styles
- `navbar.css`: Navbar and exam timer styling
- `sidebar.css`: Sidebar navigation
- `auth.css`: Login page styles
- `exam.css`: Exam interface and results styling
- `dashboard.css`: Dashboard layouts
- `grades.css`: Grade visualization
- `assignments.css`: Assignment cards and forms
- `announcements.css`: Announcement styling
- `profile.css`: Profile page
- `modal.css`: Modal overlays
- `responsive.css`: Mobile and tablet breakpoints

## Mock Data System

The `mockData.js` file provides:

- **Students**: 3 demo students with IDs, emails, photos, roles
- **Teachers**: 2 demo teachers with departments
- **Exams**: 3 sample exams (active, upcoming, closed)
- **Questions**: 7 demo questions with multiple-choice options
- **Sessions**: Exam session storage and management

All data persists in localStorage automatically.

## Exam Timer Details

The timer in the navbar:
- Displays only when an exam is active (stored in sessionStorage)
- Updates every second showing HH:MM:SS format
- Changes color based on time remaining:
  - Green: > 5 minutes
  - Yellow: 5-15 minutes
  - Red: < 5 minutes
- Auto-submits exam when time expires
- Stores `active_exam_session` in sessionStorage with endTime

## Custom Hooks

### useAuth()
```jsx
const { state, login, logout } = useAuth();
// state: { user, token, role, isAuthenticated, loading }
```

### useData()
```jsx
const {
  getExams, getExamById, getExamQuestions,
  createExamSession, saveExamAnswer, submitExam,
  getStudents, getStudentById,
  // ... other functions
} = useData();
```

## Running the Application

```bash
# Install dependencies
pnpm install

# Start dev server with hot reload
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview
```

## Browser Compatibility

- Modern browsers with ES2020+ support
- Chrome, Firefox, Safari, Edge (latest versions)
- React 19 requires Node.js 16+

## Migration Notes

The conversion from vanilla JavaScript to React preserves:
- All original functionality
- Plain CSS styling (no Tailwind)
- localStorage-based data persistence
- Mock API system
- CBT exam features with timer
- Student and teacher role separation

The major improvements:
- Component-based architecture for better code organization
- Context API for state management (no Redux needed)
- React Router for client-side navigation
- Proper lifecycle management and hooks
- Better performance with React's optimization
- Easier to maintain and extend

## Debugging

Enable React DevTools browser extension for debugging:
- Inspect components and props
- Monitor context changes
- Profile component performance

Check browser console for errors and use `console.log()` for debugging.
