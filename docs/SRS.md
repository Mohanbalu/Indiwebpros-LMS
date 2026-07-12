# Software Requirements Specification (SRS)

# IndiWebPros Learning Management System (LMS)

Version: 1.0

Status: Draft

Author: Mohan Balu

Organization: IndiWebPros

Last Updated: July 2026

---

# 1. Introduction

## 1.1 Purpose

This document specifies the functional and non-functional requirements for the IndiWebPros Learning Management System (LMS).

The system enables students to purchase courses, learn through structured content, track progress, and receive certificates through a secure, scalable web platform.

---

## 1.2 Scope

The MVP includes:

- Authentication
- Student Dashboard
- Course Management
- Course Enrollment
- Course Player
- Progress Tracking
- Certificate Generation
- Admin Dashboard

The MVP excludes:

- Live Classes
- Internship Portal
- Coding Playground
- AI Assistant
- Discussion Forums
- Leaderboards

---

# 2. Overall Description

The LMS is a cloud-hosted web application accessible from desktop, tablet, and mobile browsers.

Students can learn through videos, PDFs, and downloadable resources.

Administrators can manage courses, users, and certificates.

---

# 3. User Roles

## Student

Permissions

- Register
- Login
- Purchase Courses
- Access Purchased Courses
- View Dashboard
- Track Progress
- Download Certificates
- Edit Profile

---

## Instructor

Permissions

- Create Courses
- Upload Lessons
- Upload Videos
- Upload PDFs
- Update Course Content

---

## Mentor

Permissions

- Review Student Progress
- Evaluate Projects
- View Assigned Students

---

## Admin

Permissions

Full System Access

---

# 4. Functional Requirements

## FR-001 User Registration

The system shall allow new users to register using:

- Name
- Email
- Password
- Phone
- College

Validation:

- Email must be unique.
- Password minimum 8 characters.
- Required fields cannot be empty.

---

## FR-002 Login

Users shall login using

- Email
- Password

Upon successful authentication

Generate

- JWT Access Token
- Refresh Token

---

## FR-003 Authentication

The backend shall verify JWT for every protected request.

Unauthenticated users must receive

401 Unauthorized

---

## FR-004 Role Based Access

The system shall support:

Student

Instructor

Mentor

Admin

Every API must verify user permissions.

---

## FR-005 Course Catalog

Students can

- Browse Courses
- Search
- Filter
- View Details

---

## FR-006 Course Purchase

After successful payment

The student shall automatically gain access to the purchased course.

---

## FR-007 Dashboard

The dashboard shall display

- Purchased Courses
- Progress
- Certificates
- Continue Learning
- Notifications

---

## FR-008 Course Player

The player shall display

- Video
- Notes
- Resources
- Module List

Students can

Mark Lesson Complete

Move Previous

Move Next

---

## FR-009 Progress Tracking

The system shall automatically update

- Completed Lessons
- Last Viewed Lesson
- Percentage Completed

---

## FR-010 Certificates

The system shall automatically generate a certificate when:

Course Progress = 100%

Certificate contains

- Certificate ID
- Student Name
- Course
- Completion Date

---

## FR-011 Admin Dashboard

The Admin Dashboard shall display

- Students
- Courses
- Enrollments
- Certificates

---

## FR-012 Course Management

Admin can

Create

Read

Update

Delete

Courses

---

## FR-013 Lesson Management

Each course contains

Modules

Each module contains

Lessons

Each lesson supports

- Video
- PDF
- Resources

---

## FR-014 Student Management

Admin can

View

Search

Disable

Delete

Students

---

## FR-015 Notifications

Students receive notifications for

- New Course
- Course Updates
- Certificate Ready

---

# 5. Non-Functional Requirements

## Performance

Page Load

< 3 Seconds

API Response

< 500 ms

Dashboard Load

< 2 Seconds

---

## Scalability

Support

10,000+

Students

without architecture changes.

---

## Availability

System Availability

99.9%

---

## Reliability

Automatic backups.

Database recovery supported.

---

## Usability

Responsive Design

Desktop

Tablet

Mobile

---

## Maintainability

Modular Codebase

Reusable Components

Clean Folder Structure

---

# 6. Security Requirements

Passwords

Hash using Argon2 or bcrypt.

Never store plain text passwords.

---

Authentication

JWT

Refresh Tokens

Token Expiration

---

Authorization

Role Based Access Control

Every API validates permissions.

---

Video Security

Videos stored inside

Private AWS S3 Buckets.

Students never receive public S3 links.

Backend generates signed URLs.

---

HTTPS

Entire application must use HTTPS.

---

Validation

All API requests validated.

Reject invalid payloads.

---

Rate Limiting

Prevent brute-force attacks.

---

CORS

Allow only trusted origins.

---

Logging

Store

Login

Logout

Errors

Admin Actions

---

# 7. Database Requirements

Database

PostgreSQL

Main Entities

Users

Roles

Courses

Modules

Lessons

Enrollments

Progress

Certificates

Payments

Notifications

Resources

---

# 8. API Requirements

REST APIs

Versioning

/api/v1

JSON Responses

HTTP Status Codes

200

201

400

401

403

404

500

---

# 9. Storage Requirements

AWS S3

Store

Videos

PDFs

Images

Certificates

Resources

Temporary Files

Videos shall remain private.

---

# 10. AWS Infrastructure

Services

EC2

RDS PostgreSQL

S3

CloudFront

Route53

IAM

SES

CloudWatch

---

# 11. Error Handling

Return structured JSON.

Example

{
  "success": false,
  "message": "Unauthorized",
  "code": 401
}

---

# 12. Backup Strategy

Database

Daily Backup

S3

Versioning Enabled

Application

Git Repository

---

# 13. Deployment Requirements

Environment

Development

Staging

Production

CI/CD

GitHub Actions

Deployment

AWS EC2

---

# 14. Browser Support

Chrome

Firefox

Edge

Safari

Latest Two Versions

---

# 15. Mobile Support

Responsive

Minimum Width

320px

Maximum Width

1920px+

---

# 16. Acceptance Criteria

The MVP is complete when

✓ User Registration Works

✓ Login Works

✓ Course Purchase Works

✓ Dashboard Works

✓ Videos Play

✓ PDFs Download

✓ Progress Updates

✓ Certificates Generate

✓ Admin Can Manage Courses

✓ Admin Can Manage Students

✓ System Deploys Successfully

---

# 17. Future Enhancements

Quiz Engine

Assignments

Discussion Forums

Internship Portal

AI Learning Assistant

Research Hub

Mentorship Booking

Placement Portal

Gamification

Referral System

---

# End of Document