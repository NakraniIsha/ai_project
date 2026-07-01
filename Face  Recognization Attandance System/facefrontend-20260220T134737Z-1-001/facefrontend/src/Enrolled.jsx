import "./App.css";
import { FaHome, FaFileAlt, FaUser, FaDownload, FaClock, FaEdit, FaTrash } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import React, { useState, useEffect } from 'react';

const Enrolled = () => {
  const [students, setStudents] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [periodwiseLogs, setPeriodwiseLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [filteredSuggestions, setFilteredSuggestions] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ id: '', name: '', usn: '', age: '', course: '', phone: '' });

  const handleEditClick = (student) => {
    setEditFormData({
      id: student._id,
      name: student.name,
      usn: student.usn,
      age: student.age,
      course: student.course,
      phone: student.phone
    });
    setShowEditModal(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`http://localhost:5001/api/students/${editFormData.id}`, editFormData);
      setStudents(students.map(s => s._id === editFormData.id ? { ...s, ...editFormData } : s));
      setShowEditModal(false);
    } catch (err) {
      console.error("Error updating student:", err);
      alert("Failed to update student.");
    }
  };

  const handleDeleteStudent = async (id) => {
    if (window.confirm("Are you sure you want to delete this student?")) {
      try {
        await axios.delete(`http://localhost:5001/api/students/${id}`);
        setStudents(students.filter(student => student._id !== id));
      } catch (err) {
        console.error("Error deleting student:", err);
        alert("Failed to delete student.");
      }
    }
  };

  useEffect(() => {
    const fetchStudentsAndAttendance = async () => {
      try {
        const [studentsRes, attendanceRes, periodwiseRes] = await Promise.all([
          axios.get('http://localhost:5001/api/students'),
          axios.get('http://localhost:5001/api/attendance'),
          axios.get('http://localhost:5001/api/periodwise-attendance'),
        ]);

        setStudents(studentsRes.data);
        setAttendanceLogs(attendanceRes.data);
        setPeriodwiseLogs(periodwiseRes.data);
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    };

    fetchStudentsAndAttendance();
  }, []);

  const todayDate = new Date().toISOString().split("T")[0];

  const getAttendanceStatus = (usn) => {
    // Check regular attendance logs
    const hasRegularLog = attendanceLogs.some(log => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return log.usn === usn && logDate === todayDate;
    });

    // Check periodwise attendance logs
    const hasPeriodwiseLog = periodwiseLogs.some(log => {
      const logDate = new Date(log.recognizedAt).toISOString().split("T")[0];
      return log.usn === usn && logDate === todayDate;
    });

    return (hasRegularLog || hasPeriodwiseLog) ? "Present" : "Absent";
  };

  const handleSearchChange = (e) => {
    const query = e.target.value.toLowerCase();
    setSearch(query);

    if (!query) {
      setFilteredSuggestions([]);
    } else {
      const suggestions = students.filter((student) => {
        const nameMatch = student.name?.toLowerCase().includes(query);
        const usnMatch = student.usn?.toLowerCase().includes(query);
        return nameMatch || usnMatch;
      });
      setFilteredSuggestions(suggestions);
    }
  };

  const handleSuggestionClick = (student) => {
    setSelectedStudent(student);
    setSearch('');
    setFilteredSuggestions([]);
  };

  const closeModal = () => setSelectedStudent(null);

  return (
    <div className="min-h-screen p-4 bg-split relative">
      {selectedStudent && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg relative">
            <button onClick={closeModal} className="absolute top-2 right-3 text-xl text-gray-600 hover:text-black">
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Student Details</h2>
            <div className="space-y-2 text-sm text-gray-800">
              <p><strong>Name:</strong> {selectedStudent.name}</p>
              <p><strong>USN:</strong> {selectedStudent.usn}</p>
              <p><strong>Age:</strong> {selectedStudent.age}</p>
              <p><strong>Course:</strong> {selectedStudent.course}</p>
              <p><strong>Phone:</strong> {selectedStudent.phone}</p>
              <p><strong>Enrolled At:</strong> {new Date(selectedStudent.enrolledAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
      )}

      {showEditModal && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center">
          <div className="bg-white rounded-xl p-6 w-96 shadow-lg relative">
            <button onClick={() => setShowEditModal(false)} className="absolute top-2 right-3 text-xl text-gray-600 hover:text-black">
              &times;
            </button>
            <h2 className="text-lg font-semibold mb-4">Edit Student</h2>
            <form onSubmit={handleEditSubmit} className="space-y-3 text-sm text-gray-800">
              <div>
                <label className="block text-gray-700 font-medium mb-1">Name</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editFormData.name} onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">USN</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editFormData.usn} onChange={(e) => setEditFormData({ ...editFormData, usn: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Age</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editFormData.age} onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Course</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editFormData.course} onChange={(e) => setEditFormData({ ...editFormData, course: e.target.value })} required />
              </div>
              <div>
                <label className="block text-gray-700 font-medium mb-1">Phone</label>
                <input type="text" className="w-full border border-gray-300 p-2 rounded focus:ring-2 focus:ring-blue-500 outline-none" value={editFormData.phone} onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })} required />
              </div>
              <button type="submit" className="w-full bg-blue-600 text-white rounded-lg p-2 mt-4 hover:bg-blue-700 transition">Save Changes</button>
            </form>
          </div>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar */}
        <div className="w-full lg:w-64 bg-white shadow-xl rounded-2xl p-4 flex flex-col justify-between min-h-[90vh]">
          <div>
            <h2 className="text-xl font-semibold text-center mb-6">Admin Page</h2>
            <div className="flex flex-col gap-5">
              <Link to="/dashboard">
                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100">
                  <FaHome className="text-purple-600" />
                  <span>Home</span>
                </button>
              </Link>
              <Link to="/Addstudent">
                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100">
                  <FaUser className="text-black" />
                  <span>Add Students</span>
                </button>
              </Link>
              <Link to="/Enrolled">
                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 bg-gray-50">
                  <FaFileAlt className="text-red-500" />
                  <span>Enrolled</span>
                </button>
              </Link>
              <Link to="/Period">
                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300">
                  <FaClock className="text-green-500" />
                  <span>Period Wise</span>
                </button>
              </Link>
            </div>
          </div>
          <Link to='/signin'>
            <button className="w-full py-2 rounded-xl bg-[#1E2A78] text-white shadow-md flex items-center justify-center space-x-2 hover:bg-[#16239D]">
              <FaDownload />
              <span>LogOut</span>
            </button>
          </Link>

        </div>

        {/* Main content */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white mb-6 gap-4">
            <div>
              <p>Pages / Enrolled</p>
              <h1 className="text-lg font-semibold">Enrolled Students</h1>
            </div>
            <div className="relative">
              <input
                type="text"
                placeholder="Search Student Here"
                value={search}
                onChange={handleSearchChange}
                className="text-gray-900 placeholder:text-gray-700 rounded-xl bg-[#F7F7F7] px-4 py-2 focus:ring-2 focus:ring-blue-500 w-80"
              />
              {filteredSuggestions.length > 0 && (
                <div className="absolute w-full mt-1 bg-white shadow-lg rounded-lg max-h-60 overflow-auto z-10">
                  <ul className="text-sm text-gray-800">
                    {filteredSuggestions.map((student) => (
                      <li
                        key={student._id}
                        className="py-2 px-4 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleSuggestionClick(student)}
                      >
                        {student.name} ({student.usn})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-[1.1rem] shadow-md p-4">
            <h1 className="text-gray-900 ml-2 font-bold">List of Enrolled Students</h1>
            <div className="overflow-x-auto mt-5">
              <table className="min-w-full table-auto border-separate border-spacing-y-2 text-sm text-gray-900">
                <thead>
                  <tr className="bg-[#F7F7F7] text-gray-900">
                    <th className="text-left px-4 py-3 rounded-l-lg">Name</th>
                    <th className="text-left px-4 py-3">USN</th>
                    <th className="text-left px-4 py-3">Age</th>
                    <th className="text-left px-4 py-3">Course</th>
                    <th className="text-left px-4 py-3">Phone</th>
                    <th className="text-left px-4 py-3">Enrolled At</th>
                    <th className="text-left px-4 py-3">Status</th>
                    <th className="text-left px-4 py-3 rounded-r-lg">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.length > 0 ? (
                    students.map((student) => (
                      <tr key={student._id} className="hover:bg-[#f0f4f8] transition duration-200">
                        <td className="px-4 py-3">{student.name}</td>
                        <td className="px-4 py-3">{student.usn}</td>
                        <td className="px-4 py-3">{student.age}</td>
                        <td className="px-4 py-3">{student.course}</td>
                        <td className="px-4 py-3">{student.phone}</td>
                        <td className="px-4 py-3">{new Date(student.enrolledAt).toLocaleDateString()}</td>
                        <td className="px-4 py-3 font-semibold">
                          <span className={getAttendanceStatus(student.usn) === "Present" ? "text-green-600" : "text-red-500"}>
                            {getAttendanceStatus(student.usn)}
                          </span>
                        </td>
                        <td className="px-4 py-3 rounded-r-lg">
                          <div className="flex space-x-3 items-center">
                            <button onClick={() => handleEditClick(student)} className="text-blue-500 hover:text-blue-700 transition" title="Edit">
                              <FaEdit size={16} />
                            </button>
                            <button onClick={() => handleDeleteStudent(student._id)} className="text-red-500 hover:text-red-700 transition" title="Delete">
                              <FaTrash size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center py-4 text-gray-500">No students enrolled.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center text-sm text-gray-500 mt-6">
            © 2026 Copyright made by <span className="font-semibold text-gray-700">Isha Nakrani</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Enrolled;
