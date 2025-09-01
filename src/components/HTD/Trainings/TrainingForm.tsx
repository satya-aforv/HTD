import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaTrash, FaSave, FaArrowLeft } from "react-icons/fa";
import { toast } from "react-hot-toast";
import { htdAPI } from "../../../services/htdAPI";
import FloatingParticles from "../../Common/FloatingParticles";
import type { Training, Module, Evaluation, Expense } from "../../../types/htd";

interface Candidate {
  _id: string;
  name: string;
}

const TrainingForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);

  // Initial training state aligned with backend schema
  const [training, setTraining] = useState<Partial<Training>>({
    candidateId: "",
    startDate: "",
    endDate: "",
    status: "ongoing",
    modules: [],
    skillsAcquired: [],
    notes: "",
  });

  const [newSkill, setNewSkill] = useState<string>("");

  // Fetch candidates for dropdown
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await htdAPI.getCandidates({});
        setCandidates(response.candidates);
      } catch (error) {
        console.error("Error fetching candidates:", error);
        toast.error("Failed to fetch candidates");
      }
    };

    fetchCandidates();
    setLoading(false);
  }, []);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setTraining((prev) => ({ ...prev, [name]: value }));
  };

  const addSkill = () => {
    const skill = newSkill.trim();
    if (!skill) {
      toast.error("Skill name is required");
      return;
    }
    setTraining((prev) => {
      const existing = (prev.skillsAcquired || []);
      const isDuplicate = existing.some((s: string) => s.trim().toLowerCase() === skill.toLowerCase());
      if (isDuplicate) {
        toast.error("Skill already added");
        return prev;
      }
      return {
        ...prev,
        skillsAcquired: [...existing, skill],
      };
    });
    setNewSkill("");
  };

  const removeSkill = (index: number) => {
    setTraining((prev) => ({
      ...prev,
      skillsAcquired: (prev.skillsAcquired || []).filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!training.candidateId || !training.startDate) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSubmitting(true);

    try {
      if (isEditMode && id) {
        await htdAPI.updateTraining(id, training);
        toast.success("Training updated successfully");
      } else {
        await htdAPI.createTraining(training);
        toast.success("Training created successfully");
      }

      navigate("/htd/trainings");
    } catch (error: any) {
      console.error("Error saving training:", error);
      toast.error(error.response?.data?.message || "Failed to save training");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-3 sm:px-4 relative overflow-hidden">
      <FloatingParticles />

      <motion.div
        className="max-w-6xl mx-auto relative z-10"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        {/* Header */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={() => navigate("/htd/trainings")}
            className="mb-4 flex items-center text-blue-600 hover:text-blue-800 transition-colors"
          >
            <FaArrowLeft className="mr-2" />
            Back to Trainings
          </button>
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-800 mb-2">
            {isEditMode ? "Edit Training" : "Create New Training"}
          </h1>
          <p className="text-gray-600">
            {isEditMode
              ? "Update training information and track progress"
              : "Set up a new training program for candidates"}
          </p>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="space-y-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          {/* Basic Information Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg mb-8">
              <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Basic Training Information
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Candidate Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Candidate *
                  </label>
                  <select
                    name="candidateId"
                    value={training.candidateId || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={isEditMode}
                  >
                    <option value="">Select Candidate</option>
                    {candidates.map((candidate) => (
                      <option key={candidate._id} value={candidate._id}>
                        {candidate.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Training Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Status
                  </label>
                  <select
                    name="status"
                    value={training.status}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="on-hold">On Hold</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    name="startDate"
                    value={training.startDate || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    name="endDate"
                    value={training.endDate || ""}
                    onChange={handleChange}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Skills Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.8 }}
          >
            <div className="bg-green-50 border-l-4 border-green-400 p-4 sm:p-6 rounded-lg mb-8">
              <h4 className="text-lg font-semibold text-green-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Skills Acquired
              </h4>

              {/* Add New Skill */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mb-4">
                <input
                  type="text"
                  placeholder="Skill name"
                  value={newSkill}
                  onChange={(e) => setNewSkill(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSkill();
                    }
                  }}
                  className="flex-1 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <button
                  type="button"
                  onClick={addSkill}
                  className="bg-green-500 hover:bg-green-600 text-white py-2 px-4 rounded-md flex items-center justify-center gap-2 w-full sm:w-auto"
                >
                  <FaPlus /> Add Skill
                </button>
              </div>

              {/* Skills List */}
              <div className="space-y-2">
                {(training.skillsAcquired || []).map(
                  (skill: string, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between bg-white p-3 rounded-md border"
                    >
                      <span className="font-medium">{skill}</span>
                      <button
                        type="button"
                        onClick={() => removeSkill(index)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  )
                )}
              </div>
            </div>
          </motion.div>

          {/* Notes Section */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.0 }}
          >
            <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-lg mb-8">
              <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                Additional Notes
              </h4>
              <textarea
                name="notes"
                value={training.notes || ""}
                onChange={handleChange}
                rows={4}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-gray-500"
                placeholder="Enter any additional notes about the training..."
              />
            </div>
          </motion.div>

          {/* Submit Button */}
          <motion.div
            className="flex flex-col sm:flex-row sm:justify-end"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.2 }}
          >
            <motion.button
              type="submit"
              disabled={submitting}
              className={`w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white py-3 px-8 rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all duration-300 ${
                submitting
                  ? "opacity-70 cursor-not-allowed"
                  : "hover:shadow-xl hover:scale-105"
              }`}
              whileHover={{ scale: submitting ? 1 : 1.05 }}
              whileTap={{ scale: submitting ? 1 : 0.95 }}
            >
              <FaSave /> {submitting ? "Saving..." : "Save Training"}
            </motion.button>
          </motion.div>
        </motion.form>
      </motion.div>
    </div>
  );
};

export default TrainingForm;
