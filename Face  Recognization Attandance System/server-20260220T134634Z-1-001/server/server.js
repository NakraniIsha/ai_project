const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');


const mongoURI = 'mongodb://localhost:27017/face_attendance';

const app = express();
const PORT = 5001;

app.use(cors());
app.use(bodyParser.json());

mongoose.connect(mongoURI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("MongoDB connection error:", err));


const studentSchema = new mongoose.Schema({
  name: String,
  usn: String,
  age: String,
  course: String,
  phone: String,
  enrolledAt: { type: Date, default: Date.now }
});

const Student = mongoose.model('Student', studentSchema);


app.post('/api/students', async (req, res) => {
  const { name, usn, age, course, phone } = req.body;

  if (!name || !usn || !age || !course || !phone) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const newStudent = new Student({ name, usn, age, course, phone });
    await newStudent.save();
    res.status(200).json({ message: "Student saved to database!" });
  } catch (err) {
    console.error("Error saving student:", err);
    res.status(500).json({ message: "Failed to save student" });
  }
});

app.get('/api/students', async (req, res) => {
  try {
    const students = await Student.find().sort({ enrolledAt: -1 });
    res.json(students);
  } catch (err) {
    console.error("Error fetching students:", err);
    res.status(500).json({ message: "Failed to fetch students" });
  }
});

app.put('/api/students/:id', async (req, res) => {
  const { name, usn, age, course, phone } = req.body;
  try {
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      { name, usn, age, course, phone },
      { new: true }
    );
    if (!updatedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    res.status(200).json({ message: "Student updated successfully", student: updatedStudent });
  } catch (err) {
    console.error("Error updating student:", err);
    res.status(500).json({ message: "Failed to update student" });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  try {
    const deletedStudent = await Student.findByIdAndDelete(req.params.id);
    if (!deletedStudent) {
      return res.status(404).json({ message: "Student not found" });
    }
    // Note: This does not delete the face data from python backend, just the database record
    // depending on requirements, it could call Python server to delete the folder.
    res.status(200).json({ message: "Student deleted successfully" });
  } catch (err) {
    console.error("Error deleting student:", err);
    res.status(500).json({ message: "Failed to delete student" });
  }
});


///////////////new log for attence storage////////

app.get('/api/attendance', async (req, res) => {
  try {
    const logs = await AttendanceLog.find().sort({ recognizedAt: -1 });
    res.json(logs);
  } catch (err) {
    console.error("Error fetching logs:", err);
    res.status(500).json({ message: "Failed to fetch attendance logs" });
  }
});

app.delete('/api/attendance/:id', async (req, res) => {
  try {
    const deletedLog = await AttendanceLog.findByIdAndDelete(req.params.id);
    if (!deletedLog) return res.status(404).json({ message: "Log not found" });
    res.status(200).json({ message: "Log deleted successfully" });
  } catch (err) {
    console.error("Error deleting log:", err);
    res.status(500).json({ message: "Failed to delete log" });
  }
});

const attendanceLogSchema = new mongoose.Schema({
  usn: String,
  name: String,
  course: String,
  recognizedAt: { type: Date, default: Date.now }
});

const AttendanceLog = mongoose.model('AttendanceLog', attendanceLogSchema);

app.post('/api/attendance', async (req, res) => {
  const { usn, name, course, recognizedAt } = req.body;

  if (!usn) {
    return res.status(400).json({ message: "USN is required" });
  }

  try {
    let student = await Student.findOne({ usn });

    // If no student found, but name & course provided => allow manual entry
    if (!student && (!name || !course)) {
      return res.status(404).json({ message: "Student not found, and insufficient manual data provided" });
    }

    // Determine the current date (or use recognizedAt if provided)
    const today = new Date().toISOString().split('T')[0];
    const recognizedDate = recognizedAt ? new Date(recognizedAt) : new Date();

    // Check for existing attendance on the same day
    const existingLog = await AttendanceLog.findOne({
      usn,
      recognizedAt: {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1))
      }
    });

    if (existingLog) {
      return res.status(400).json({ message: "Attendance already recorded for today" });
    }

    // Use data from the DB or from manual fields
    const log = new AttendanceLog({
      usn,
      name: student ? student.name : name,
      course: student ? student.course : course,
      recognizedAt: recognizedDate
    });

    await log.save();

    res.status(200).json({ message: "Attendance logged successfully" });
  } catch (err) {
    console.error("Error logging attendance:", err);
    res.status(500).json({ message: "Failed to log attendance" });
  }
});



///////////////////////admin login and signup///////////
const AdminSchema = new mongoose.Schema({
  username: String,
  email: String,
  password: String,
});

const Admin = mongoose.model("Admin", AdminSchema);


app.post("/signup", async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existingAdmin = await Admin.findOne({ email });
    if (existingAdmin) {
      return res.status(400).json({ message: "Email already registered" });
    }

    const newAdmin = new Admin({
      username,
      email,
      password, // no hashing
    });

    await newAdmin.save();
    res.status(201).json({ message: "Admin created successfully" });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});
/////////////////signin.///////
app.post("/signin", async (req, res) => {
  const { email, password } = req.body;

  try {
    const admin = await Admin.findOne({ email });

    if (!admin) {
      return res.status(404).json({ message: "Admin not found" });
    }

    if (admin.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.status(200).json({ message: "Signin successful", admin: { username: admin.username, email: admin.email } });
  } catch (err) {
    console.error("Signin error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
});


// ===================== Period Model =====================
const periodSchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: { type: String, default: 'FaClock' },
  time: { type: String, required: true },
  hour: { type: Number, required: true },
  minute: { type: Number, default: 0 },
  order: { type: Number, default: 0 }
});

const Period = mongoose.model('Period', periodSchema);

// --- Period CRUD ---
app.get('/api/periods', async (req, res) => {
  try {
    const periods = await Period.find().sort({ order: 1 });
    res.json(periods);
  } catch (err) {
    console.error('Error fetching periods:', err);
    res.status(500).json({ message: 'Failed to fetch periods' });
  }
});

app.post('/api/periods', async (req, res) => {
  const { name, icon, time, hour, minute, order } = req.body;
  if (!name || !time || hour === undefined) {
    return res.status(400).json({ message: 'Name, time, and hour are required' });
  }
  try {
    const newPeriod = new Period({ name, icon, time, hour, minute: minute || 0, order: order || 0 });
    await newPeriod.save();
    res.status(201).json({ message: 'Period created successfully', period: newPeriod });
  } catch (err) {
    console.error('Error creating period:', err);
    res.status(500).json({ message: 'Failed to create period' });
  }
});

app.put('/api/periods/:id', async (req, res) => {
  const { name, icon, time, hour, minute, order } = req.body;
  try {
    const updated = await Period.findByIdAndUpdate(
      req.params.id,
      { name, icon, time, hour, minute, order },
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: 'Period not found' });
    res.status(200).json({ message: 'Period updated successfully', period: updated });
  } catch (err) {
    console.error('Error updating period:', err);
    res.status(500).json({ message: 'Failed to update period' });
  }
});

app.delete('/api/periods/:id', async (req, res) => {
  try {
    const deleted = await Period.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Period not found' });
    res.status(200).json({ message: 'Period deleted successfully' });
  } catch (err) {
    console.error('Error deleting period:', err);
    res.status(500).json({ message: 'Failed to delete period' });
  }
});

const periodwiseAttendanceLogSchema = new mongoose.Schema({
  usn: String,
  name: String,
  course: String,
  period: String,
  recognizedAt: { type: Date, default: Date.now }
});

const PeriodwiseAttendanceLog = mongoose.model('PeriodwiseAttendanceLog', periodwiseAttendanceLogSchema);

app.post('/api/periodwise-attendance', async (req, res) => {
  const { usn, recognizedAt } = req.body;

  console.log("Incoming data:", req.body);

  if (!usn) {
    return res.status(400).json({ message: "USN is required" });
  }

  try {
    const student = await Student.findOne({ usn });

    if (!student) {
      console.log("Student not found");
      return res.status(404).json({ message: "Student not found" });
    }

    const now = recognizedAt ? new Date(recognizedAt) : new Date();
    const period = await getPeriodForCurrentTime(now);

    console.log("Calculated period:", period);

    const today = new Date(now.toISOString().split('T')[0]);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const existingLog = await PeriodwiseAttendanceLog.findOne({
      usn,
      period,
      recognizedAt: { $gte: today, $lt: tomorrow }
    });

    if (existingLog) {
      return res.status(400).json({ message: `Attendance already recorded for ${period} today` });
    }

    const log = new PeriodwiseAttendanceLog({
      usn,
      name: student.name,
      course: student.course,
      period,
      recognizedAt: now
    });

    await log.save();
    console.log("Successfully saved period-wise attendance:", log);

    res.status(200).json({ message: `Period-wise attendance recorded for ${period}`, log });

  } catch (err) {
    console.error("Error logging periodwise attendance:", err);
    res.status(500).json({ message: "Internal server error" });
  }
});




async function getPeriodForCurrentTime(currentTime) {
  const hours = currentTime.getHours();
  const minutes = currentTime.getMinutes();
  const totalMinutes = hours * 60 + minutes;

  // Try to match from dynamic periods in DB
  const periods = await Period.find().sort({ hour: 1, minute: 1 });

  if (periods.length > 0) {
    let matched = null;
    for (const p of periods) {
      const pTotal = p.hour * 60 + (p.minute || 0);
      if (totalMinutes >= pTotal) {
        matched = p.name;
      }
    }
    if (matched) return matched;
  }

  // Fallback if no periods in DB
  if (hours >= 6 && hours < 12) return 'Morning Session';
  if (hours >= 12 && hours < 17) return 'Afternoon Session';
  if (hours >= 17 && hours < 22) return 'Evening Session';

  return 'General';
}

app.get('/api/periodwise-attendance', async (req, res) => {
  try {
    const logs = await PeriodwiseAttendanceLog.find().sort({ recognizedAt: -1 });
    res.json(logs);
  } catch {
    console.log("Error fetching periodwise logs:", err);
    res.status(500).json({ message: "Failed to fetch periodwise attendance logs" });
  }
});

app.delete('/api/periodwise-attendance/:id', async (req, res) => {
  try {
    const deletedLog = await PeriodwiseAttendanceLog.findByIdAndDelete(req.params.id);
    if (!deletedLog) return res.status(404).json({ message: "Log not found" });
    res.status(200).json({ message: "Log deleted successfully" });
  } catch (err) {
    console.error("Error deleting log:", err);
    res.status(500).json({ message: "Failed to delete log" });
  }
});





app.listen(PORT, async () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Wait for MongoDB connection and seed default data
  setTimeout(async () => {
    try {
      // Seed default admin if not exists
      const existingAdmin = await Admin.findOne({ email: 'nayankotadiya686@gmail.com' });
      if (!existingAdmin) {
        await Admin.create({
          username: 'nayan3654u',
          email: 'nayankotadiya686@gmail.com',
          password: 'password123'
        });
        console.log("Default admin created");
      }

      // Seed default student if not exists (USN must match face folder name)
      const existingStudent = await Student.findOne({ usn: '345' });
      if (!existingStudent) {
        await Student.create({
          name: 'Nayan Kotadiya',
          usn: '345',
          age: '20',
          course: 'Computer Science',
          phone: '9876543210'
        });
        console.log("Default student created");
      }

      // Seed default periods if none exist
      const periodCount = await Period.countDocuments();
      if (periodCount === 0) {
        await Period.insertMany([
          { name: 'Java', icon: 'FaJava', time: '9:00 AM', hour: 9, minute: 0, order: 1 },
          { name: 'Python', icon: 'FaPython', time: '10:00 AM', hour: 10, minute: 0, order: 2 },
          { name: 'Network', icon: 'FaNetworkWired', time: '11:30 AM', hour: 11, minute: 30, order: 3 },
          { name: 'AI/ML', icon: 'FaBrain', time: '12:30 PM', hour: 12, minute: 30, order: 4 },
          { name: 'React', icon: 'FaReact', time: '6:30 PM', hour: 18, minute: 30, order: 5 }
        ]);
        console.log("Default periods seeded");
      }
    } catch (err) {
      console.error("Error seeding data:", err);
    }
  }, 2000);
});
