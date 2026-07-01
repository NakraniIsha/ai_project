# 🎓 Face Recognition Attendance System

An AI-powered attendance management system that uses **real-time face recognition** to automatically identify enrolled students and log their attendance. Built with a modern full-stack architecture combining a React frontend, Node.js/Express backend, Python face recognition API, and MongoDB database.

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Project Structure](#-project-structure)
- [Prerequisites](#-prerequisites)
- [Installation & Setup](#-installation--setup)
- [Usage](#-usage)
- [API Endpoints](#-api-endpoints)
- [How It Works](#-how-it-works)
- [Contributors](#-contributors)

---

## ✨ Features

- **Real-Time Face Detection & Recognition** — Uses OpenCV's Haar Cascade classifier and LBPH (Local Binary Patterns Histograms) recognizer for accurate face identification via webcam.
- **Student Enrollment** — Register students with their details (Name, USN, Age, Course, Phone) and capture face images through the webcam for training.
- **Automated Attendance Logging** — Recognized students are automatically marked present with a timestamp; duplicate entries for the same day are prevented.
- **Period-Wise Attendance** — Supports configurable class periods/subjects (e.g., Java, Python, AI/ML) with time-based auto-detection.
- **Admin Authentication** — Secure sign-in and sign-up system for administrators.
- **Dashboard** — Visual dashboard showing attendance records and statistics.
- **CRUD Operations** — Full create, read, update, and delete support for students, attendance logs, and class periods.
- **Responsive UI** — Modern React-based frontend styled with Tailwind CSS.

---

## 🛠 Tech Stack

| Layer             | Technology                                                  |
| ----------------- | ----------------------------------------------------------- |
| **Frontend**      | React 19, Vite, Tailwind CSS 4, React Router, Axios         |
| **Backend API**   | Node.js, Express 5, Mongoose, MongoDB                       |
| **Face Recognition** | Python 3, Flask, OpenCV (cv2), NumPy                     |
| **Database**      | MongoDB (local instance)                                    |
| **Algorithm**     | Haar Cascade (detection) + LBPH Recognizer (identification) |

---

## 🏗 Architecture

```
┌─────────────────────┐     HTTP      ┌──────────────────────┐
│                     │  (REST API)   │                      │
│   React Frontend    │──────────────▶│  Node.js/Express     │
│   (Vite, Port 5173) │               │  Server (Port 5001)  │
│                     │               │                      │
└────────┬────────────┘               └──────────┬───────────┘
         │                                       │
         │  HTTP (base64 images)                  │  Mongoose
         │                                       │
         ▼                                       ▼
┌─────────────────────┐               ┌──────────────────────┐
│                     │               │                      │
│   Python Flask API  │               │     MongoDB          │
│   (Port 5000)       │               │  (face_attendance)   │
│   - Face Enrollment │               │  - Students          │
│   - Face Recognition│               │  - AttendanceLogs    │
│                     │               │  - Periods           │
└─────────────────────┘               │  - Admins            │
                                      └──────────────────────┘
```

---

## 📁 Project Structure

```
Face  Recognization Attandance System/
│
├── facefrontend-*/                 # React Frontend
│   └── facefrontend/
│       ├── src/
│       │   ├── App.jsx             # Main app with routing
│       │   ├── frontpage.jsx       # Landing page
│       │   ├── signin.jsx          # Admin sign-in / sign-up
│       │   ├── dashboard.jsx       # Main dashboard
│       │   ├── Addstudent.jsx      # Student enrollment form + webcam
│       │   ├── Enrolled.jsx        # View & manage enrolled students
│       │   ├── period.jsx          # Period-wise attendance tracking
│       │   └── ManagePeriods.jsx   # CRUD for class periods
│       ├── package.json
│       └── vite.config.js
│
├── python-face-api-*/              # Python Face Recognition API
│   └── python-face-api/
│       ├── recognize_api.py        # Flask API (enroll + recognize)
│       ├── enroll.py               # Standalone enrollment script
│       └── faces/                  # Stored face images (per student USN)
│
└── server-*/                       # Node.js Backend Server
    └── server/
        ├── server.js               # Express API (students, attendance, periods, auth)
        └── package.json
```

---

## 📌 Prerequisites

Make sure you have the following installed on your system:

- **Node.js** (v18 or higher) — [Download](https://nodejs.org/)
- **Python** (v3.8 or higher) — [Download](https://www.python.org/)
- **MongoDB** (local or cloud) — [Download](https://www.mongodb.com/try/download/community)
- **Git** — [Download](https://git-scm.com/)
- A **webcam** for face enrollment and recognition

---

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/NakraniIsha/ai_project.git
cd "ai_project/Face  Recognization Attandance System"
```

### 2. Start MongoDB

Make sure your MongoDB instance is running locally on port `27017`:

```bash
mongod
```

### 3. Setup & Run the Node.js Backend Server

```bash
cd "server-20260220T134634Z-1-001/server"
npm install
node server.js
```

The server will start on **http://localhost:5001** and seed default data (admin, sample student, default periods).

### 4. Setup & Run the Python Face Recognition API

```bash
cd "python-face-api-20260220T134630Z-1-001/python-face-api"
pip install flask flask-cors opencv-python opencv-contrib-python numpy
python recognize_api.py
```

The Face API will start on **http://localhost:5000**.

### 5. Setup & Run the React Frontend

```bash
cd "facefrontend-20260220T134737Z-1-001/facefrontend"
npm install
npm run dev
```

The frontend will start on **http://localhost:5173**.

---

## 📖 Usage

1. **Open the app** — Navigate to `http://localhost:5173` in your browser.
2. **Sign In** — Use the admin credentials to log in (default: `nayankotadiya686@gmail.com` / `password123`).
3. **Enroll Students** — Go to "Add Student", fill in the details, and capture face images via webcam.
4. **Take Attendance** — Use the dashboard to start face recognition. The system will detect and identify enrolled students in real time.
5. **View Records** — Check attendance logs and period-wise reports from the dashboard.
6. **Manage Periods** — Add, edit, or delete class periods/subjects from the Manage Periods page.

---

## 🔌 API Endpoints

### Node.js Backend (`http://localhost:5001`)

| Method   | Endpoint                         | Description                          |
| -------- | -------------------------------- | ------------------------------------ |
| `POST`   | `/signup`                        | Register a new admin                 |
| `POST`   | `/signin`                        | Admin sign-in                        |
| `GET`    | `/api/students`                  | Get all enrolled students            |
| `POST`   | `/api/students`                  | Add a new student                    |
| `PUT`    | `/api/students/:id`              | Update student details               |
| `DELETE` | `/api/students/:id`              | Delete a student                     |
| `GET`    | `/api/attendance`                | Get all attendance logs              |
| `POST`   | `/api/attendance`                | Log attendance for a student         |
| `DELETE` | `/api/attendance/:id`            | Delete an attendance log             |
| `GET`    | `/api/periods`                   | Get all configured periods           |
| `POST`   | `/api/periods`                   | Create a new period                  |
| `PUT`    | `/api/periods/:id`               | Update a period                      |
| `DELETE` | `/api/periods/:id`               | Delete a period                      |
| `GET`    | `/api/periodwise-attendance`     | Get period-wise attendance logs      |
| `POST`   | `/api/periodwise-attendance`     | Log period-wise attendance           |
| `DELETE` | `/api/periodwise-attendance/:id` | Delete a period-wise attendance log  |

### Python Face API (`http://localhost:5000`)

| Method | Endpoint     | Description                                      |
| ------ | ------------ | ------------------------------------------------ |
| `POST` | `/enroll`    | Enroll a student's face (base64 image + USN)     |
| `POST` | `/recognize` | Recognize a face from a base64 image             |

---

## 🧠 How It Works

### Face Enrollment
1. The frontend captures a webcam frame and sends a **base64-encoded image** along with the student's USN to the Python API.
2. The API uses **Haar Cascade** to detect the face in the image.
3. The detected face is cropped, padded, resized to 200×200 pixels, histogram-equalized, and saved to `faces/<USN>/`.

### Face Recognition
1. A webcam frame is sent to the `/recognize` endpoint.
2. The **LBPH Recognizer** is trained (or uses a cached model) on all saved face images.
3. The face in the image is detected, preprocessed identically to enrollment, and predicted.
4. If the confidence score is below the threshold (80), the student's USN is returned; otherwise, it is marked as "Unknown".

---

## 👥 Contributors

- **Isha Nakrani** — Developer

---

## 📄 License

This project is for **educational purposes**.

---

> Built with ❤️ using React, Node.js, Python & OpenCV
