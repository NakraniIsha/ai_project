import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

const Front = () => {
  const [recognizedName, setRecognizedName] = useState("USN will appear here");
  const [recognizedStudentName, setRecognizedStudentName] = useState("Name will appear here");
  const [attendanceMessage, setAttendanceMessage] = useState("");
  const [students, setStudents] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const response = await axios.get("http://localhost:5001/api/students");
        setStudents(response.data);
      } catch (err) {
        console.error("Error fetching students:", err);
      }
    };

    fetchStudents();
  }, []);

  useEffect(() => {
    const getCamera = async () => {
      try {
        // Request higher resolution for better face detection
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
        console.error("Camera access error:", err);
      }
    };

    getCamera();

    return () => {
      if (videoRef.current && videoRef.current.srcObject) {
        const tracks = videoRef.current.srcObject.getTracks();
        tracks.forEach((track) => track.stop());
      }
    };
  }, []);

  const captureFrame = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return null;

    // Use the actual video dimensions for better quality
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Use higher quality JPEG
    return canvas.toDataURL("image/jpeg", 0.95);
  };

  const handleRecognize = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setAttendanceMessage("Recognizing...");
    setRecognizedName("Scanning...");
    setRecognizedStudentName("Scanning...");

    const imageData = captureFrame();
    if (!imageData) {
      setAttendanceMessage("Camera not ready. Please wait.");
      setRecognizedName("USN will appear here");
      setRecognizedStudentName("Name will appear here");
      setIsProcessing(false);
      return;
    }

    try {
      const response = await axios.post("http://localhost:5000/recognize", { image: imageData });
      const rawUsn = response.data.usn || "";
      const usn = rawUsn.trim();
      const confidence = response.data.confidence;

      if (!usn || usn === "No face detected" || usn === "Could not decode image" || usn === "No image provided") {
        setRecognizedName("No face detected");
        setRecognizedStudentName("—");
        setAttendanceMessage("Please position your face clearly in front of the camera.");
        setIsProcessing(false);
        return;
      }

      if (usn === "Unknown" || usn.startsWith("No enrolled")) {
        setRecognizedName("Unknown");
        setRecognizedStudentName("Not recognized");
        setAttendanceMessage(`Face detected but not recognized (confidence: ${confidence || "N/A"}). Please enroll first.`);
        setIsProcessing(false);
        return;
      }

      // Set USN immediately so user sees it right away
      setRecognizedName(usn);

      // Fetch students list and find matching student by trimmed USN
      let studentName = "";
      let studentCourse = "";
      try {
        const studentsResponse = await axios.get("http://localhost:5001/api/students");
        const freshStudents = studentsResponse.data;
        const matchedStudent = freshStudents.find(
          (s) => s.usn && s.usn.trim() === usn
        );
        if (matchedStudent) {
          studentName = matchedStudent.name || "";
          studentCourse = matchedStudent.course || "";
        }
      } catch (err) {
        console.error("Error fetching students:", err);
      }

      // Show name or fallback
      setRecognizedStudentName(studentName || `Student (${usn})`);

      const recognizedAt = new Date().toISOString();

      // Submit regular attendance
      try {
        await axios.post("http://localhost:5001/api/attendance", {
          usn,
          name: studentName,
          course: studentCourse,
          recognizedAt
        });
      } catch (err) {
        console.log("Regular attendance:", err.response?.data?.message || "error");
      }

      // Submit period-wise attendance
      try {
        const res = await axios.post("http://localhost:5001/api/periodwise-attendance", {
          usn,
          recognizedAt
        });
        setAttendanceMessage(`✅ ${studentName || usn} — ${res.data.message}`);
      } catch (err) {
        const msg = err.response?.data?.message || "Failed to record attendance.";
        setAttendanceMessage(`${studentName || usn} — ${msg}`);
      }

    } catch (err) {
      console.error(err);
      setRecognizedName("Error");
      setRecognizedStudentName("Recognition failed");
      setAttendanceMessage("Error connecting to face recognition server. Is it running?");
    } finally {
      setIsProcessing(false);
    }
  };




  return (
    <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radial-gradient(125%_125%_at_50%_10%,#000_40%,#63e_100%)]">
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col sm:flex-row gap-5 w-full h-[80vh] p-5">
          <div className="w-1/2 h-full flex items-center justify-center">
            <div className="w-full max-w-2xl aspect-video bg-black rounded-2xl shadow-2xl overflow-hidden border-2 border-[#E8E4FF]">
              <video ref={videoRef} autoPlay muted className="w-full h-full object-cover" />
              <canvas ref={canvasRef} width="640" height="480" className="hidden"></canvas>
            </div>
          </div>

          <div className="w-1/2 h-full flex flex-col items-center justify-center text-center">
            <h1 className="text-5xl font-bold text-white drop-shadow-md mb-6">
              Smart Attendance System
            </h1>

            <div className="mt-5 text-2xl font-medium text-gray-300">
              Recognized USN: <span className="text-emerald-400 font-bold">{recognizedName}</span>
            </div>
            <div className="mt-5 text-2xl font-medium text-gray-300">
              Recognized Student Name: <span className="text-emerald-400 font-bold">{recognizedStudentName}</span>
            </div>

            {/* Display the attendance message */}
            {attendanceMessage && (
              <div className="mt-5 text-lg font-medium text-yellow-300">
                {attendanceMessage}
              </div>
            )}
            <div className="flex flex-row gap-3">
              <button
                onClick={handleRecognize}
                className="mt-8 transition-background inline-flex h-12 items-center justify-center rounded-xl border border-gray-800 bg-gradient-to-r from-gray-100 via-[#c7d2fe] to-[#8678f9] bg-[length:200%_200%] bg-[0%_0%] px-6 font-medium text-gray-950 duration-500 hover:bg-[100%_200%] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50"
              >
                Recognize Face
              </button>

              <Link to="/Signin">
                <button className="mt-8 transition-background inline-flex h-12 items-center justify-center rounded-xl border border-gray-800 bg-gradient-to-r from-gray-100 via-[#c7d2fe] to-[#8678f9] bg-[length:200%_200%] bg-[0%_0%] px-6 font-medium text-gray-950 duration-500 hover:bg-[100%_200%] focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 focus:ring-offset-gray-50">
                  Dashboard
                </button>
              </Link>
            </div>

          </div>
        </div>
      </div>
      <div className="absolute bottom-4 w-full text-center text-sm text-gray-400">
        © 2026 Copyright made by <span className="font-semibold">Isha Nakrani</span>
      </div>
    </div>
  );
};

export default Front;
