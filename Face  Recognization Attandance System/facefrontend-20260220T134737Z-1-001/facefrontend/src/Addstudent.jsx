import "./App.css";
import { FaHome, FaFileAlt, FaUser, FaDownload, FaClock } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import axios from 'axios';
import React, { useState, useEffect, useRef } from 'react';

const Addstudent = () => {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [isEnrolling, setIsEnrolling] = useState(false);

  const [student, setStudent] = useState({
    name: '',
    usn: '',
    age: '',
    course: '',
    phone: ''
  });

  useEffect(() => {
    const getCameraStream = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user"
          }
        });
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (err) {
        console.error("Error accessing webcam: ", err);
      }
    };

    getCameraStream();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const handleChange = (e) => {
    setStudent({ ...student, [e.target.name]: e.target.value });
  };

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    // Use actual video resolution for better quality
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext('2d');
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.95);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const captureAndSend = async () => {
    if (isEnrolling) return;

    if (!student.name || !student.usn || !student.age || !student.course || !student.phone) {
      alert("Please fill in all student details.");
      return;
    }

    setIsEnrolling(true);

    try {
      // Capture 3 frames for better enrollment (slight natural movement helps)
      let successCount = 0;
      for (let i = 0; i < 3; i++) {
        const imageData = captureFrame();
        if (!imageData) {
          alert("Camera not ready. Please wait.");
          setIsEnrolling(false);
          return;
        }

        try {
          const response = await fetch('http://localhost:5000/enroll', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ usn: student.usn, image: imageData })
          });

          const result = await response.json();
          if (response.ok) {
            successCount++;
            console.log(`[Capture ${i + 1}/3] ${result.message}`);
          } else {
            console.warn(`[Capture ${i + 1}/3] ${result.message}`);
          }
        } catch (err) {
          console.error(`[Capture ${i + 1}/3] Error:`, err);
        }

        // Small delay between captures for slight natural movement
        if (i < 2) await delay(500);
      }

      if (successCount === 0) {
        alert("No face could be detected. Please position your face clearly in front of the camera.");
        setIsEnrolling(false);
        return;
      }

      // Save student data to DB
      const dataResponse = await fetch('http://localhost:5001/api/students', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(student)
      });

      const dataResult = await dataResponse.json();
      console.log('Student DB response:', dataResult.message);

      alert(`Student enrolled successfully! (${successCount} face captures saved)`);
      setStudent({ name: '', age: '', course: '', phone: '', usn: '' });

    } catch (err) {
      console.error('Error sending data to backend:', err);
      alert("Failed to enroll. Check if the face recognition server is running.");
    } finally {
      setIsEnrolling(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-split">
      <div className="flex flex-col lg:flex-row gap-6">


        <div className="w-full lg:w-64 bg-white shadow-xl rounded-2xl p-4 flex flex-col justify-between min-h-[90vh]">
          <div>
            <h2 className="text-xl font-semibold text-center mb-6">Admin Page</h2>
            <div className="flex flex-col gap-5">
              <Link to="/dashboard">
                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300">
                  <FaHome className="text-purple-600" />
                  <span>Home</span>
                </button>
              </Link>
              <Link to="/Addstudent">
                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300">
                  <FaUser className="text-black" />
                  <span>Add Students</span>
                </button>
              </Link>
              <Link to="/Enrolled">
                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100 active:bg-gray-200 transition-all duration-300">
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
            <button className="w-full py-2 rounded-xl bg-[#1E2A78] text-white shadow-md flex items-center justify-center space-x-2 hover:bg-[#16239D] active:bg-[#0f1c77] transition-all duration-300">
              <FaDownload />
              <span>LogOut</span>
            </button></Link>
        </div>

        {/* Main Content */}
        <div className="flex-1">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white mt-2 gap-4">

          </div>

          <div className="bg-white rounded-[1.1rem] shadow-md p-4">
            <h1 className="text-gray-900 font-semibold mb-4 ml-2">Add Students Here</h1>
            <div className="w-full grid gap-5 grid-cols-2 mt-5 p-5">
              <input type="text" name="name" value={student.name} onChange={handleChange} className="placeholder:text-gray-700 rounded-xl bg-[#F7F7F7] px-4 py-2" placeholder="Enter the student's name" />
              <input type="text" name="usn" value={student.usn} onChange={handleChange} className="placeholder:text-gray-700 rounded-xl bg-[#F7F7F7] px-4 py-2" placeholder="Enter the USN" />
              <input type="text" name="age" value={student.age} onChange={handleChange} className="placeholder:text-gray-700 rounded-xl bg-[#F7F7F7] px-4 py-2" placeholder="Enter the age" />
              <input type="text" name="course" value={student.course} onChange={handleChange} className="placeholder:text-gray-700 rounded-xl bg-[#F7F7F7] px-4 py-2" placeholder="Enter the course" />
              <input type="number" name="phone" value={student.phone} onChange={handleChange} className="placeholder:text-gray-700 rounded-xl bg-[#F7F7F7] px-4 py-2" placeholder="Enter the mobile number" />
            </div>

            {/* Camera & Button */}
            <div className='flex flex-col lg:flex-row w-full gap-4 mt-6'>
              <div className='w-full lg:w-1/2 h-[53vh] bg-white/20 backdrop-blur-lg border border-gray-50 rounded-2xl p-2 flex justify-center items-center overflow-hidden'>
                <div className="w-full h-full bg-black rounded-2xl shadow-2xl overflow-hidden">
                  <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
                  <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
                </div>
              </div>
              <div className='w-full lg:w-1/2 flex flex-col justify-start mt-5 items-center text-center'>
                <h1 className='text-gray-800 font-bold text-[1.5rem] mb-4'>Please place your face properly</h1>
                <button
                  onClick={captureAndSend}
                  className='w-sm rounded-xl bg-gradient-to-r from-blue-700 to-blue-600 px-8 py-3 font-bold text-white transition-all hover:opacity-90 hover:shadow-lg'>
                  Enroll Face
                </button>
              </div>
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

export default Addstudent;
