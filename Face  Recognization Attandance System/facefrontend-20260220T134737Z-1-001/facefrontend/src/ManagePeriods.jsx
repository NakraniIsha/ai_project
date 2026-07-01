import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as FaIcons from "react-icons/fa";
import {
    FaHome, FaFileAlt, FaUser, FaDownload, FaClock,
    FaPlus, FaEdit, FaTrash, FaTimes, FaSave, FaCog
} from "react-icons/fa";
import axios from "axios";

const ICON_OPTIONS = [
    "FaJava", "FaPython", "FaNetworkWired", "FaBrain", "FaReact",
    "FaClock", "FaCode", "FaDatabase", "FaLaptopCode", "FaBook",
    "FaChalkboardTeacher", "FaFlask", "FaCogs", "FaProjectDiagram", "FaTerminal"
];

const renderIcon = (iconName) => {
    const IconComponent = FaIcons[iconName] || FaIcons.FaClock;
    return <IconComponent />;
};

const ManagePeriods = () => {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        name: "", icon: "FaClock", time: "", hour: 0, minute: 0, order: 0
    });
    const [saving, setSaving] = useState(false);

    const fetchPeriods = async () => {
        try {
            const res = await axios.get("http://localhost:5001/api/periods");
            setPeriods(res.data);
        } catch (err) {
            console.error("Error fetching periods:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPeriods();
    }, []);

    const resetForm = () => {
        setFormData({ name: "", icon: "FaClock", time: "", hour: 0, minute: 0, order: 0 });
        setEditingId(null);
        setShowForm(false);
    };

    const handleEdit = (period) => {
        setFormData({
            name: period.name,
            icon: period.icon || "FaClock",
            time: period.time,
            hour: period.hour,
            minute: period.minute || 0,
            order: period.order || 0,
        });
        setEditingId(period._id);
        setShowForm(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm("Are you sure you want to delete this period?")) return;
        try {
            await axios.delete(`http://localhost:5001/api/periods/${id}`);
            setPeriods(periods.filter((p) => p._id !== id));
        } catch (err) {
            alert("Failed to delete period.");
            console.error(err);
        }
    };

    const formatDisplayTime = (hour, minute) => {
        const h = parseInt(hour);
        const m = parseInt(minute) || 0;
        const ampm = h >= 12 ? "PM" : "AM";
        const displayH = h > 12 ? h - 12 : h === 0 ? 12 : h;
        return `${displayH}:${m.toString().padStart(2, "0")} ${ampm}`;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);

        const payload = {
            ...formData,
            hour: parseInt(formData.hour),
            minute: parseInt(formData.minute) || 0,
            order: parseInt(formData.order) || 0,
            time: formatDisplayTime(formData.hour, formData.minute),
        };

        try {
            if (editingId) {
                const res = await axios.put(`http://localhost:5001/api/periods/${editingId}`, payload);
                setPeriods(periods.map((p) => (p._id === editingId ? res.data.period : p)));
            } else {
                const res = await axios.post("http://localhost:5001/api/periods", payload);
                setPeriods([...periods, res.data.period]);
            }
            resetForm();
        } catch (err) {
            alert(err.response?.data?.message || "Something went wrong");
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-screen p-4 bg-split relative">
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
                                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100">
                                    <FaFileAlt className="text-red-500" />
                                    <span>Enrolled</span>
                                </button>
                            </Link>
                            <Link to="/Period">
                                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl hover:bg-gray-100">
                                    <FaClock className="text-green-500" />
                                    <span>Period Wise</span>
                                </button>
                            </Link>
                            <Link to="/ManagePeriods">
                                <button className="flex items-center space-x-2 w-full text-left py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200">
                                    <FaCog className="text-indigo-600" />
                                    <span>Manage Periods</span>
                                </button>
                            </Link>
                        </div>
                    </div>
                    <Link to="/signin">
                        <button className="w-full py-2 rounded-xl bg-[#1E2A78] text-white shadow-md flex items-center justify-center space-x-2 hover:bg-[#16239D]">
                            <FaDownload />
                            <span>LogOut</span>
                        </button>
                    </Link>
                </div>

                {/* Main Content */}
                <div className="flex-1">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center text-white mb-6 gap-4">
                        <div>
                            <p>Pages / Manage Periods</p>
                            <h1 className="text-lg font-semibold">Manage Periods</h1>
                        </div>
                        <button
                            onClick={() => { resetForm(); setShowForm(true); }}
                            className="flex items-center gap-2 bg-white text-indigo-700 font-semibold px-5 py-2 rounded-xl shadow-md hover:shadow-lg transition-all hover:bg-indigo-50"
                        >
                            <FaPlus /> Add New Period
                        </button>
                    </div>

                    {/* Period Cards Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                        {loading ? (
                            <div className="col-span-full text-center text-gray-400 py-10">Loading periods...</div>
                        ) : periods.length === 0 ? (
                            <div className="col-span-full text-center text-gray-400 py-10">
                                No periods configured yet. Click "Add New Period" to get started.
                            </div>
                        ) : (
                            periods.map((period) => (
                                <div
                                    key={period._id}
                                    className="bg-white rounded-2xl shadow-md p-5 flex flex-col gap-3 hover:shadow-lg transition-shadow relative group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center text-xl shadow-sm">
                                                {renderIcon(period.icon)}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-lg text-gray-800">{period.name}</h3>
                                                <p className="text-sm text-gray-500">{period.time}</p>
                                            </div>
                                        </div>
                                        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-full">
                                            #{period.order || 0}
                                        </span>
                                    </div>

                                    <div className="text-sm text-gray-500">
                                        <span className="font-medium">Schedule:</span> {period.hour}:{(period.minute || 0).toString().padStart(2, "0")} ({period.time})
                                    </div>

                                    <div className="flex gap-2 mt-1">
                                        <button
                                            onClick={() => handleEdit(period)}
                                            className="flex-1 flex items-center justify-center gap-1 text-sm bg-blue-50 text-blue-600 py-2 rounded-xl hover:bg-blue-100 transition-colors font-medium"
                                        >
                                            <FaEdit size={13} /> Edit
                                        </button>
                                        <button
                                            onClick={() => handleDelete(period._id)}
                                            className="flex-1 flex items-center justify-center gap-1 text-sm bg-red-50 text-red-600 py-2 rounded-xl hover:bg-red-100 transition-colors font-medium"
                                        >
                                            <FaTrash size={13} /> Delete
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Add/Edit Form Modal */}
                    {showForm && (
                        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
                            <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md mx-4 relative animate-fade-in">
                                <button
                                    onClick={resetForm}
                                    className="absolute top-4 right-4 text-gray-400 hover:text-gray-700 transition"
                                >
                                    <FaTimes size={18} />
                                </button>

                                <h2 className="text-xl font-bold text-gray-800 mb-5">
                                    {editingId ? "Edit Period" : "Add New Period"}
                                </h2>

                                <form onSubmit={handleSubmit} className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Period Name *</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                            placeholder="e.g., Mathematics"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Hour (0-23) *</label>
                                            <input
                                                type="number"
                                                required
                                                min={0}
                                                max={23}
                                                value={formData.hour}
                                                onChange={(e) => setFormData({ ...formData, hour: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Minute (0-59)</label>
                                            <input
                                                type="number"
                                                min={0}
                                                max={59}
                                                value={formData.minute}
                                                onChange={(e) => setFormData({ ...formData, minute: e.target.value })}
                                                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Display Order</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={formData.order}
                                            onChange={(e) => setFormData({ ...formData, order: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                            placeholder="1, 2, 3..."
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Icon</label>
                                        <select
                                            value={formData.icon}
                                            onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                                            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 border border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                                        >
                                            {ICON_OPTIONS.map((ic) => (
                                                <option key={ic} value={ic}>{ic}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex gap-3 pt-2">
                                        <button
                                            type="button"
                                            onClick={resetForm}
                                            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-600 font-medium hover:bg-gray-50 transition"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-semibold shadow-md hover:shadow-lg hover:opacity-95 transition flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <FaSave size={14} />
                                            {saving ? "Saving..." : editingId ? "Update Period" : "Add Period"}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* Footer */}
                    <div className="text-center text-sm text-gray-500 mt-6">
                        © 2026 Copyright made by <span className="font-semibold text-gray-700">Isha Nakrani</span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ManagePeriods;
