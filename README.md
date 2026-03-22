# Learnova

Learnova is a full-stack e-learning platform built for both learners and instructors/admins. It combines course discovery, structured learning, quiz-based engagement, progress tracking, ratings and reviews, invitation-based access, reporting, and premium course support in one platform.

This project was built as a hackathon-ready product demo with a strong focus on practical user flows, clean UI, and real-world admin controls.

## Overview

Learnova supports two major user journeys:

- Learner journey:
  - discover published courses
  - search and explore courses
  - view detailed course information
  - enroll and start learning
  - track progress lesson by lesson
  - attempt quizzes
  - earn points and badge levels
  - leave ratings and reviews

- Admin/Instructor journey:
  - create and manage courses
  - add lessons and quizzes
  - publish and unpublish courses
  - control visibility and access
  - invite attendees
  - monitor learner progress through reporting dashboards

## Key Features

### Learner Features

- Home page with platform introduction
- Courses page with:
  - course cards
  - cover image
  - title
  - short description
  - tags
  - search by course name
  - filter by tags
  - grid/list layouts
- Course detail page with:
  - course overview
  - visibility and access information
  - learner progress summary
  - ratings and reviews tab
  - add/edit review option for logged-in users
- My Courses page with:
  - learner profile summary
  - enrolled courses
  - progress-based action buttons
  - points and badge journey
- Learning page with:
  - lesson-by-lesson navigation
  - mark lesson complete
  - course completion percentage
  - quiz attempts
  - reward points
  - badge progression

### Admin / Instructor Features

- Admin dashboard
- Course management panel
- Course publishing controls
- Visibility controls:
  - Everyone
  - Signed In
- Access controls:
  - Open
  - Invitation
  - Paid
- Lesson creation and editing
- Quiz builder with configurable reward values
- Attendee invitation support
- Reporting dashboard with:
  - Total Participants
  - Yet to Start
  - In Progress
  - Completed
  - clickable overview filters
  - customizable columns
  - learner progress table

## Access Logic

Learnova supports multiple course delivery rules:

### Publishing
Only published courses are shown on the learner-facing website.

### Visibility
- `Everyone`: course is visible to all users
- `SignedIn`: course is visible only to logged-in users

### Access
- `Open`: learners can enroll and start normally
- `Invitation`: only invited or enrolled users can access the course
- `Paid`: designed for premium access flow

## Progress Tracking

Progress is tracked per learner per course.

This includes:
- completed lesson status
- incomplete lesson status
- quiz completion
- overall course completion percentage
- start date
- completion date
- time spent
- course status:
  - Yet to Start
  - In Progress
  - Completed

## Quiz Rewards and Gamification

Learnova includes quiz-based engagement with reward progression.

### Quiz attempts
- multiple attempts are allowed
- learners can retry quizzes
- passing status is tracked

### Reward points
Points reduce with later attempts based on reward settings configured by the instructor:
- 1st attempt
- 2nd attempt
- 3rd attempt
- 4th and more

### Badge system
Total learner points determine badge level. This creates a gamified learning journey and encourages course completion.

## Ratings and Reviews

Each course includes a dedicated ratings and reviews experience.

Features:
- average rating display
- review breakdown
- learner review list
- avatar initials and user name
- review text
- logged-in users can add or edit their own rating and review

## Reporting Dashboard

The reporting dashboard is designed for instructors and admins.

It provides:
- overview cards for major learner states
- card-based filtering
- searchable learner table
- course-wise learner progress view
- column customization side panel
- enrollment and completion data visibility

## Paid Courses

The platform supports paid course structure at the data and UI level.

Current support includes:
- paid course configuration in admin
- course price
- learner-facing buy course messaging
- secure payment architecture preparation

For hackathon/demo usage, paid courses can also be presented as premium/demo content depending on the presentation flow.

## Tech Stack

### Frontend
- React
- Vite
- React Router
- Tailwind CSS
- Zustand
- Axios
- React Hot Toast
- React Icons

### Backend
- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT Authentication
- bcryptjs
- Multer
- Cloudinary-ready media support

### Payment Integration
- Razorpay SDK integrated in backend architecture
- secure order and verification flow prepared
- webhook support added for reconciliation

## Project Structure

```text
Learnova/
├── backend/
│   ├── config/
│   ├── controllers/
│   ├── middleware/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── server.js
│   └── seedSampleCourses.js
├── frontend/
│   └── client/
│       ├── src/
│       │   ├── api/
│       │   ├── components/
│       │   ├── pages/
│       │   ├── store/
│       │   └── utils/
│       └── package.json
└── package.json
Main Frontend Routes
Learner Routes
/
/courses
/courses/:id
/my-courses
/learn/:id
Admin Routes
/admin/dashboard
/admin/courses/:id
/admin/reporting
Auth Routes
/login
/signup
/admin-signup
Backend APIs
Major API groups:

/api/auth
/api/courses
/api/progress
/api/reviews
/api/reporting
/api/payments
Installation
1. Clone the repository
bash

git clone <your-repo-url>
cd Learnova
2. Install backend dependencies
bash

cd backend
npm install
3. Install frontend dependencies
bash

cd ../frontend/client
npm install
Environment Variables
Create a .env file inside backend/.

Example:

env

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
FRONTEND_URL=http://localhost:5173

CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
RAZORPAY_WEBHOOK_SECRET=your_razorpay_webhook_secret
Running the Project
Start backend
bash

cd backend
npm run dev
Start frontend
bash

cd frontend/client
npm run dev
Frontend will run on:

text

http://localhost:5173
Backend will run on:

text

http://localhost:5000
Seeding Demo Courses
The project includes demo seed data with free and paid courses.

To seed sample courses:

bash

cd backend
npm run seed:sample
This creates:

demo instructor
multiple published courses
lessons
quizzes
premium demo paid courses
Demo Presentation Flow
Recommended hackathon demo flow:

Home page
Courses page
Course detail page
My Courses page
Learning page
Admin dashboard
Course management page
Reporting dashboard
This flow demonstrates both the learner experience and the admin/instructor workflow in one presentation.

Why Learnova
Learnova is more than a course listing platform. It is designed as a structured learning ecosystem where:

learners stay engaged through progress and rewards
instructors control access and course delivery
admins gain visibility through reporting
the platform architecture supports future monetization and scaling
Future Enhancements
Possible next improvements:

full live payment demo for paid courses
payment history page
certificates on completion
leaderboard and social learning
advanced analytics and exports
notification and email workflows
video lesson player enhancements
role-specific reporting improvements
Team Note
This project was created for hackathon presentation and live demo use, with an emphasis on practical features, user flow clarity, and scalable architecture.
