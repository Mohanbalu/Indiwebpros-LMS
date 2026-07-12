# Product Requirements Document (PRD)

# IndiWebPros Learning Management System (LMS)

Version: 1.0

Status: Draft

Owner: IndiWebPros

Author: Mohan Balu

Last Updated: July 2026

---

# 1. Product Overview

## Product Name

IndiWebPros LMS

## Product Type

Learning Management System (LMS)

## Platform

Web Application

## Primary Domain

learn.indiwebpros.in

---

# 2. Vision

To build a premium learning platform that enables students to learn practical industry skills through structured courses, projects, certifications, internships, and career-oriented learning experiences.

Unlike traditional learning platforms that focus only on recorded videos, IndiWebPros LMS aims to provide a complete ecosystem where students can learn, practice, build projects, earn certificates, and prepare for internships and jobs.

---

# 3. Mission

Deliver affordable, practical, project-based education that bridges the gap between academics and industry requirements.

---

# 4. Problem Statement

Students often face several challenges:

- Learning only theoretical concepts.
- Lack of practical implementation.
- No real-world projects.
- No GitHub experience.
- No structured learning path.
- No proper certification.
- No centralized platform for learning.

IndiWebPros LMS solves these problems by providing an industry-focused learning experience.

---

# 5. Goals

The MVP should allow students to:

- Register
- Login
- Browse Courses
- Purchase Courses
- Watch Lessons
- Download Resources
- Track Progress
- Receive Certificates

Admin should be able to:

- Create Courses
- Upload Videos
- Upload Notes
- Manage Students
- Generate Certificates

---

# 6. Target Audience

Primary Audience

- Engineering Students
- Degree Students
- Diploma Students
- Beginners

Secondary Audience

- Job Seekers
- Freshers
- Career Switchers
- Freelancers

---

# 7. User Roles

## Student

Can:

- Register
- Login
- Browse Courses
- Purchase Courses
- Access Purchased Courses
- Watch Videos
- Download Resources
- Track Progress
- Download Certificates
- Edit Profile

---

## Instructor

Can:

- Create Courses
- Upload Videos
- Upload Notes
- Upload Resources
- Manage Course Content

---

## Mentor

Can:

- Review Student Progress
- Guide Students
- Provide Feedback

---

## Admin

Full System Access

Can:

- Manage Users
- Manage Courses
- Manage Certificates
- View Analytics
- Manage Platform

---

# 8. Learning Plans

Every course should contain three plans.

## Foundation

Target Audience

Beginners

Features

- Recorded Videos
- Basic Notes
- Exercises
- Certificate

---

## Professional

Everything in Foundation plus

- Premium Notes
- Projects
- Source Code
- Assignments
- GitHub Repository

---

## Career Accelerator

Everything in Professional plus

- Industry Projects
- Mentorship
- Resume Review
- LinkedIn Review
- Mock Interviews
- Career Guidance

---

# 9. Course Categories

- Full Stack Development
- Artificial Intelligence
- Machine Learning
- Python
- Java
- C Programming
- C++
- React
- Cloud Computing
- Azure
- AWS
- Cyber Security
- Data Science
- Career Development

---

# 10. Student Journey

Visitor

↓

Explore Courses

↓

Register

↓

Login

↓

Purchase Course

↓

Access Dashboard

↓

Watch Lessons

↓

Complete Modules

↓

Track Progress

↓

Complete Course

↓

Certificate Generated

↓

Download Certificate

---

# 11. MVP Features

## Authentication

- Registration
- Login
- Logout
- Password Reset
- Email Verification

---

## Dashboard

- Continue Learning
- Progress Overview
- My Courses
- Certificates
- Notifications

---

## Course Catalog

- Categories
- Search
- Filters
- Course Details

---

## Course Player

- Video Lessons
- PDF Notes
- Resources
- Previous Lesson
- Next Lesson
- Mark Complete

---

## Progress Tracking

Automatically store

- Lessons Completed
- Percentage
- Last Viewed Lesson

---

## Certificates

Generate automatically after

100% completion.

Certificate contains

- Student Name
- Course Name
- Completion Date
- Certificate ID

---

## Profile

Editable

- Name
- Profile Photo
- College
- Phone
- Password

---

# 12. Admin Features

Admin Dashboard

Statistics

- Students
- Courses
- Revenue (Future)
- Certificates

Course Management

- Create
- Edit
- Delete
- Publish

Student Management

- View
- Search
- Disable

Certificate Management

- View
- Generate
- Download

---

# 13. Payment Flow

Student

↓

Select Course

↓

Payment Gateway

↓

Payment Success

↓

Course Access

↓

Dashboard Updated

Note

Payment Gateway will be integrated after MVP.

For MVP

Payment status can be updated manually by Admin.

---

# 14. AWS Infrastructure

Services

- EC2
- S3
- RDS PostgreSQL
- CloudFront
- Route53
- SES
- IAM

Videos

Stored inside

AWS S3

Database

AWS RDS PostgreSQL

Application

Hosted on EC2

---

# 15. Technology Stack

Frontend

- React.js
- TypeScript
- Vite
- Tailwind CSS
- React Router

Backend

- Node.js
- Express.js

Database

- PostgreSQL

ORM

- Prisma

Authentication

- JWT

Storage

- AWS S3

Hosting

- AWS EC2

---

# 16. Security Requirements

- JWT Authentication
- Password Hashing
- HTTPS
- Role Based Access
- Private S3 Buckets
- Signed URLs
- Rate Limiting
- Input Validation
- SQL Injection Protection
- XSS Protection

---

# 17. Success Metrics

Platform Launch

Student Registrations

Course Purchases

Course Completion Rate

Certificate Downloads

Active Users

Student Retention

---

# 18. Future Roadmap

Phase 2

- Quiz System
- Assignments
- Discussion Forums
- Leaderboards
- Badges
- XP System

Phase 3

- Internship Portal
- Mentorship Booking
- Placement Portal
- AI Learning Assistant
- Research Hub
- Live Classes

---

# 19. Out of Scope (MVP)

The following features are intentionally excluded from Phase 1:

- Live Streaming
- AI Assistant
- Team Projects
- Coding Playground
- Placement Portal
- Internship Portal
- Discussion Forums
- Gamification
- Referral System
- Affiliate Program

These will be developed in future releases.

---

# 20. Product Principles

The platform must always be:

- Simple
- Fast
- Secure
- Responsive
- Scalable
- Easy to Maintain
- Industry Standard
- Student Friendly

---

# 21. Release Plan

Phase 1

Launch MVP

Phase 2

Learning Enhancements

Phase 3

Community & Career Features

Phase 4

Enterprise Expansion

---

# End of Document