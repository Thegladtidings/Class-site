# CBT (Computer-Based Test) Exam System


## node_modules
## Overview

The JSS 2 Class Portal now includes a comprehensive Computer-Based Test (CBT) system that allows teachers to create scheduled exams and students to take them with live timers.

## Features

### Student Features

#### 1. Exams List Page (`#/student/exams`)
- View all available exams categorized by status:
  - **Active Exams**: Currently running with time remaining
  - **Upcoming Exams**: Scheduled for future with start date/time
  - **Past Exams**: Previously taken with scores and review options
- Quick access to start active exams
- View scores for completed exams

#### 2. Active Exam Page (`#/student/exam/:examId`)
- **One Question Per Page**: Clean, focused interface
- **Live Countdown Timer**: Displayed in navbar showing MM:SS:HH
  - Green (>5 min remaining)
  - Yellow (5-15 min remaining)
  - Red (<5 min remaining)
- **Progress Indicator**: Shows current question number and total
- **Answer Tracking**: Auto-save answers to localStorage and API
- **Navigation**: Previous/Next buttons between questions
- **Submit Button**: Final submission with confirmation prompt
- **Session Management**: Prevents navigation away during exam
- **Auto-Submit**: Automatically submits when time expires

#### 3. Exam Results Page (`#/student/exam-results/:sessionId`)
- **Score Display**: Large percentage circle with color coding
- **Statistics**:
  - Correct answers count
  - Incorrect answers count
  - Total questions
- **Answers Review Table**:
  - Question number
  - Your answer
  - Correct answer
  - Status (correct/incorrect)
- **Color Coding**:
  - Green for correct answers
  - Red for incorrect answers
- **Back Navigation**: Return to exams list

### Teacher Features

#### 1. Exam Management Page (`#/teacher/exams`)
- **View All Exams**: Organized by status (Active, Upcoming, Completed)
- **Create New Exam**: Button to create exams
- **Exam Actions**:
  - Manage Questions
  - View Results
  - Delete exam
- **Exam Information**:
  - Name and subject
  - Duration
  - Number of questions
  - Publication status (Draft/Published)

#### 2. Question Editor Page (`#/teacher/exam-questions/:examId`)
- **Add Questions**:
  - Question text
  - Four multiple-choice options (A, B, C, D)
  - Select correct answer
  - Explanation for the answer
- **View Question Bank**:
  - List all questions for the exam
  - Delete questions
  - Visual indicator of correct answer (green highlight)

#### 3. Results Dashboard (`#/teacher/exam-results/:examId`)
- **Class Statistics**:
  - Number of students attempted
  - Average score
  - Pass count (≥70%)
  - Highest score
- **Student Results Table**:
  - Student name
  - Score (points/total)
  - Percentage
  - Submission date
  - Pass/Fail status
- **Color Coding**:
  - Green for pass (≥70%)
  - Red for fail (<70%)

## Exam Flow

### Creating an Exam (Teacher)
1. Click "Exams" in sidebar
2. Click "Create New Exam"
3. Fill exam details (name, subject, date/time, duration, questions count)
4. Save and go to question editor
5. Add questions one by one
6. Publish when ready

### Taking an Exam (Student)
1. Click "Exams" in sidebar
2. See available exams categorized by status
3. Click "Start Exam" on an active exam
4. Answer questions one by one
5. Use Previous/Next to navigate
6. Watch the timer in navbar
7. Click "Submit Exam" on last question
8. Confirm submission
9. Auto-calculate score and show results
10. Review answers with explanations

## Data Storage

All exam data is stored in localStorage with the following collections:

### Exams
```javascript
{
  id: 'EX001',
  name: 'Mathematics Term 1 CBT',
  subject: 'Mathematics',
  description: '...',
  startDateTime: ISO string,
  endDateTime: ISO string,
  durationMinutes: 120,
  totalQuestions: 50,
  published: true,
  createdBy: 'T001',
  createdDate: '2024-04-28'
}
```

### Questions
```javascript
{
  id: 'Q001',
  examId: 'EX001',
  questionText: 'What is 2 + 2?',
  options: { A: '3', B: '4', C: '5', D: '6' },
  correctAnswer: 'B',
  explanation: '2 + 2 equals 4'
}
```

### Exam Sessions
```javascript
{
  id: 'SES1234567890',
  examId: 'EX001',
  studentId: 'S001',
  startedAt: ISO string,
  submittedAt: ISO string,
  answers: [
    { questionId: 'Q001', selectedAnswer: 'B' },
    // ...
  ],
  score: 45,
  percentage: 90,
  status: 'submitted' // or 'in-progress'
}
```

## API Endpoints (Mock)

All endpoints are mocked using localStorage:

### Student Endpoints
- `GET /api/student-exams` - List exams for current student
- `GET /api/exams/:id` - Get exam details
- `GET /api/exams/:id/questions` - Get questions for exam
- `POST /api/exams/:id/start` - Create exam session
- `POST /api/exam-answer` - Save single answer
- `POST /api/exams/:id/submit` - Submit exam
- `GET /api/exam-sessions/:id` - Get session for review

### Teacher Endpoints
- `GET /api/exams` - List all exams
- `POST /api/exams` - Create exam
- `PUT /api/exams/:id` - Update exam
- `DELETE /api/exams/:id` - Delete exam
- `POST /api/exams/:id/questions` - Add question
- `GET /api/exams/:id/results` - Get exam results

## Timer Implementation

### Navbar Timer
- Displays remaining time in MM:SS:HH format
- Updates every second
- Changes color based on time remaining:
  - Green: >5 minutes
  - Yellow: 5-15 minutes
  - Red: <5 minutes
- Stored in sessionStorage while exam is active
- Automatically cleaned up after submission

### Auto-Submit
- Exam automatically submits when time reaches zero
- User is redirected to results page
- No data loss

## Navigation Guards

- Students cannot navigate away from active exam (beforeunload event)
- Exam routes are protected by authentication
- Non-existent exams show error messages
- Results can only be viewed for submitted exams

## Demo Data

The application comes with demo exams:

### 1. Mathematics Term 1 CBT
- **Status**: Active (starts in 2 days)
- **Questions**: 50 multiple-choice
- **Duration**: 2 hours

### 2. English Literature Test
- **Status**: Upcoming (starts in 5 days)
- **Questions**: 40 multiple-choice
- **Duration**: 1.5 hours

### 3. Science Practical Exam
- **Status**: Active Now
- **Questions**: 60 multiple-choice
- **Duration**: 3 hours

### Demo Accounts
- **Student**: student@school.com / password123
- **Teacher**: teacher@school.com / password123

## Styling

Exam-related styles are in `/src/css/exam.css` including:
- Exam card layouts
- Question display
- Timer styling
- Results display
- Teacher management interfaces
- Responsive design for mobile/tablet

## Features Implemented

✓ One question per page interface
✓ Multiple choice questions only
✓ Live countdown timer (MM:SS:HH)
✓ Auto-save answers
✓ Previous/Next navigation
✓ Submit with confirmation
✓ Auto-calculate scores
✓ Immediate results display
✓ Answer review with correct answers shown
✓ Color-coded results (green/red)
✓ Teacher exam creation
✓ Question management
✓ Results dashboard
✓ Auto-submit on timeout
✓ Session management
✓ localStorage persistence

## Browser Compatibility

- Chrome/Edge (Recommended)
- Firefox
- Safari
- Mobile browsers (responsive design)

## Future Enhancements

- Question shuffling
- Partial marking
- Short answer questions
- Image-based questions
- Result email notifications
- Question import/export
- Exam analytics
- Student analytics
- Timed breaks between questions
