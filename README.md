# ClassSite

ClassSite is a classroom portal for teachers and students to organize learning in one place. Teachers can manage student progress, assignments, exams, announcements, and upcoming one-to-one class sessions. Students can review their learning information and see the classes scheduled for them.

## Class scheduling

Teachers can create, reschedule, or cancel a class from **Class Schedule** in the teacher portal. A session includes a student, subject, start time, duration, and optional preparation notes. The API rejects overlapping sessions for either the teacher or student. Students see upcoming sessions and any cancellations in **Class Schedule** in their portal.

## Run locally

- Start the Express API from `server` with `npm run dev`.
- Start the Vite app from `client` with `npm run dev`.
- Configure the required server and client environment variables in their respective local environment files before starting the services.
