const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

// In-memory storage
const students = [
  {
    _id: '1',
    name: 'Nayan Kotadiya',
    usn: '2023031035103345',
    age: '20',
    course: 'Computer Science',
    phone: '9876543210',
    enrolledAt: new Date()
  }
];
const attendanceLogs = [];
const admins = [
  {
    _id: '1',
    username: 'nayan3654u',
    email: 'nayankotadiya686@gmail.com',
    password: 'password123'
  }
];
const periodwiseAttendanceLogs = [];

// Student APIs
app.post('/api/students', async (req, res) => {
  const { name, usn, age, course, phone } = req.body;

  if (!name || !usn || !age || !course || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const existingStudent = students.find(s => s.usn === usn);
  if (existingStudent) {
    return res.status(400).json({ message: "Student with this USN already exists" });
  }

  const newStudent = { 
    _id: Date.now().toString(),
    name, 
    usn, 
    age, 
    course, 
    phone, 
    enrolledAt: new Date() 
  };
  students.push(newStudent);
  
  res.status(200).json({ message: "Student saved to database!" });
});

app.get('/api/students', async (req, res) => {
  res.json(students.sort((a, b) => b.enrolledAt - a.enrolledAt));
});

// Attendance APIs
app.get('/api/attendance', async (req, res) => {
  res.json(attendanceLogs.sort((a, b) => b.recognizedAt - a.recognizedAt));
});

app.post('/api/attendance', async (req, res) => {
  const { usn, name, course, recognizedAt } = req.body;

  if (!usn) {
    return res.status(400).json({ message: "USN is required" });
  }

  const student = students.find(s => s.usn === usn);

  if (!student && (!name || !course)) {
    return res.status(404).json({ message: "Student not found, and insufficient manual data provided" });
  }

  const today = new Date().toISOString().split('T')[0];
  const recognizedDate = recognizedAt ? new Date(recognizedAt) : new Date();

  const existingLog = attendanceLogs.find(log => {
    const logDate = new Date(log.recognizedAt).toISOString().split('T')[0];
    return log.usn === usn && logDate === today;
  });

  if (existingLog) {
    return res.status(400).json({ message: "Attendance already recorded for today" });
  }

  const log = {
    _id: Date.now().toString(),
    usn,
    name: student ? student.name : name,
    course: student ? student.course : course,
    recognizedAt: recognizedDate
  };
  attendanceLogs.push(log);

  res.status(200).json({ message: "Attendance logged successfully" });
});

// Admin Auth APIs
app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  const existingAdmin = admins.find(a => a.email === email);
  if (existingAdmin) {
    return res.status(400).json({ message: "Email already registered" });
  }

  const newAdmin = {
    _id: Date.now().toString(),
    username,
    email,
    password
  };
  admins.push(newAdmin);

  res.status(201).json({ message: "Admin created successfully" });
});

app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  const admin = admins.find(a => a.email === email);

  if (!admin) {
    return res.status(404).json({ message: "Admin not found" });
  }

  if (admin.password !== password) {
    return res.status(401).json({ message: "Invalid password" });
  }

  res.status(200).json({ 
    message: "Signin successful", 
    admin: { username: admin.username, email: admin.email } 
  });
});

// Period-wise Attendance APIs
app.post('/api/periodwise-attendance', async (req, res) => {
  const { usn, recognizedAt } = req.body;

  console.log("Incoming data:", req.body);

  if (!usn) {
    return res.status(400).json({ message: "USN is required" });
  }

  const student = students.find(s => s.usn === usn);

  if (!student) {
    console.log("Student not found");
    return res.status(404).json({ message: "Student not found" });
  }

  const now = recognizedAt ? new Date(recognizedAt) : new Date();
  const period = getPeriodForCurrentTime(now);

  console.log("Calculated period:", period);

  if (period === 'No Period') {
    return res.status(400).json({ message: "No valid class period at this time" });
  }

  const today = now.toISOString().split('T')[0];

  const existingLog = periodwiseAttendanceLogs.find(log => {
    const logDate = new Date(log.recognizedAt).toISOString().split('T')[0];
    return log.usn === usn && log.period === period && logDate === today;
  });

  if (existingLog) {
    return res.status(400).json({ message: `Attendance already recorded for ${period} today` });
  }

  const log = {
    _id: Date.now().toString(),
    usn,
    name: student.name,
    course: student.course,
    period,
    recognizedAt: now
  };
  periodwiseAttendanceLogs.push(log);

  console.log("Successfully saved period-wise attendance:", log);

  res.status(200).json({ message: `Period-wise attendance recorded for ${period}`, log });
});

app.get('/api/periodwise-attendance', async (req, res) => {
  res.json(periodwiseAttendanceLogs.sort((a, b) => b.recognizedAt - a.recognizedAt));
});

function getPeriodForCurrentTime(currentTime) {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();

  if (hours === 9) return 'Java';
  if (hours === 10 && minutes >= 10) return 'Python';
  if (hours === 11 && minutes >= 20) return 'Networking';
  if (hours === 12 && minutes >= 30) return 'AI/ML';
  if (hours === 18 && minutes >= 30) return 'React';
  
  // Allow testing anytime - default to current period based on time
  if (hours >= 6 && hours < 12) return 'Morning Session';
  if (hours >= 12 && hours < 17) return 'Afternoon Session';
  if (hours >= 17 && hours < 22) return 'Evening Session';

  return 'General';
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log('Using in-memory storage (no MongoDB required)');
});
