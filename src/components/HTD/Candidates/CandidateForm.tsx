import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FaPlus, FaTrash } from "react-icons/fa";
import FloatingParticles from "../../Common/FloatingParticles";
import Autocomplete from "../../Common/Autocomplete";
import { useLocationData } from "../../../hooks/useLocationData";
import api from "../../../services/api";

interface Education {
  degree: string;
  institution: string;
  fieldOfStudy: string;
  yearOfPassing: number;
  percentage: number;
  _id?: string;
}

interface Experience {
  company: string;
  role: string;
  startDate: string;
  endDate: string;
  description: string;
  type: "IT" | "NON_IT";
  _id?: string;
}

interface CareerGap {
  startDate: string;
  endDate: string;
  reason: string;
  _id?: string;
}

interface Skill {
  name: string;
  type: "IT" | "NON_IT";
  proficiency: "BEGINNER" | "INTERMEDIATE" | "ADVANCED" | "EXPERT";
  acquiredDuring: "BEFORE_TRAINING" | "DURING_TRAINING";
  _id?: string;
}

interface Document {
  name: string;
  type: string;
  url: string;
  _id?: string;
}

interface CandidateFormData {
  name: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  gender: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  status: string;
  highestQualification: string;
  previousSalary: number;
  expectedSalary: number;
  education: Education[];
  itExperience: Experience[];
  nonItExperience: Experience[];
  careerGaps: CareerGap[];
  skills: Skill[];
  documents: Document[];
  notes: string;
}

const initialFormData: CandidateFormData = {
  name: "",
  email: "",
  phone: "",
  dateOfBirth: "",
  gender: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  status: "ACTIVE",
  highestQualification: "",
  previousSalary: 0,
  expectedSalary: 0,
  education: [],
  itExperience: [],
  nonItExperience: [],
  careerGaps: [],
  skills: [],
  documents: [],
  notes: "",
};

const CandidateForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<CandidateFormData>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("personal");
  const [selectedState, setSelectedState] = useState<{
    value: string;
    label: string;
  } | null>(null);
  const [selectedCity, setSelectedCity] = useState<{
    value: string;
    label: string;
  } | null>(null);

  // Location data hook
  const {
    states,
    cities,
    loadCitiesForState,
    getLocationByPincode,
    isValidPincode,
  } = useLocationData();
  const [fileUploads, setFileUploads] = useState<{
    [key: string]: File | null;
  }>({});
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});

  // Fetch candidate data if editing
  useEffect(() => {
    if (id) {
      const fetchCandidate = async () => {
        try {
          setLoading(true);
          const response = await api.get(`/htd/candidates/${id}`);
          const candidateData = response.data;
          console.log(response, "candidateData");

          // Helper to format date strings to YYYY-MM-DD
          const formatDateForInput = (dateString: string | undefined) => {
            if (!dateString) return "";
            try {
              return new Date(dateString).toISOString().split("T")[0];
            } catch {
              return ""; // Return empty if date is invalid
            }
          };

          // Deep merge and format dates, ensuring no null/undefined values are set in state
          const formattedData: CandidateFormData = {
            ...initialFormData,
            ...candidateData,
            dateOfBirth: formatDateForInput(candidateData.dateOfBirth),
            education:
              candidateData.education?.map((edu: Education) => ({ ...edu })) ||
              [],
            itExperience:
              candidateData.itExperience?.map((exp: Experience) => ({
                ...exp,
                startDate: formatDateForInput(exp.startDate),
                endDate: formatDateForInput(exp.endDate),
              })) || [],
            nonItExperience:
              candidateData.nonItExperience?.map((exp: Experience) => ({
                ...exp,
                startDate: formatDateForInput(exp.startDate),
                endDate: formatDateForInput(exp.endDate),
              })) || [],
            careerGaps:
              candidateData.careerGaps?.map((gap: CareerGap) => ({
                ...gap,
                startDate: formatDateForInput(gap.startDate),
                endDate: formatDateForInput(gap.endDate),
              })) || [],
            skills: candidateData.skills || [],
            documents: candidateData.documents || [],
            notes: candidateData.notes || "",
            previousSalary: candidateData.previousSalary || 0,
            expectedSalary: candidateData.expectedSalary || 0,
          };

          setFormData(formattedData);
          setError(null);
        } catch (err) {
          console.error("Error fetching candidate:", err);
          setError("Failed to load candidate data. Please try again.");
        } finally {
          setLoading(false);
        }
      };

      fetchCandidate();
    }
  }, [id]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError("");
      setSuccess("");

      let response;
      if (id) {
        // Update existing candidate
        response = await api.put(`/htd/candidates/${id}`, formData);
        setSuccess("Candidate updated successfully!");
      } else {
        // Create new candidate
        response = await api.post("/htd/candidates", formData);
        setSuccess("Candidate created successfully!");
      }

      // Handle document uploads if any
      if (Object.keys(fileUploads).length > 0) {
        await handleDocumentUploads(response.data.candidate._id || id);
      }

      // Redirect after a short delay
      setTimeout(() => {
        navigate("/htd/candidates");
      }, 2000);
    } catch (err) {
      console.error("Error saving candidate:", err);
      setError(
        "Failed to save candidate. Please check your inputs and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUploads = async (candidateId: string) => {
    for (const [docType, file] of Object.entries(fileUploads)) {
      if (file) {
        const formData = new FormData();
        formData.append("document", file);
        formData.append("type", docType);

        try {
          await api.post(`/htd/candidates/${candidateId}/documents`, formData, {
            headers: {
              "Content-Type": "multipart/form-data",
            },
            onUploadProgress: (progressEvent) => {
              const percentCompleted = Math.round(
                (progressEvent.loaded * 100) / (progressEvent.total || 100)
              );
              setUploadProgress((prev) => ({
                ...prev,
                [docType]: percentCompleted,
              }));
            },
          });
        } catch (err) {
          console.error(`Error uploading ${docType}:`, err);
          setError((prev) =>
            prev
              ? `${prev}\nFailed to upload ${docType}.`
              : `Failed to upload ${docType}.`
          );
        }
      }
    }
  };

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    docType: string
  ) => {
    if (e.target.files && e.target.files[0]) {
      setFileUploads((prev) => ({
        ...prev,
        [docType]: e.target.files![0],
      }));
    }
  };

  // Education handlers
  const addEducation = () => {
    setFormData((prev) => ({
      ...prev,
      education: [
        ...prev.education,
        {
          degree: "",
          institution: "",
          fieldOfStudy: "",
          yearOfPassing: new Date().getFullYear(),
          percentage: 0,
        },
      ],
    }));
  };

  const updateEducation = (
    index: number,
    field: keyof Education,
    value: string | number
  ) => {
    const updatedEducation = [...formData.education];
    updatedEducation[index] = { ...updatedEducation[index], [field]: value };
    setFormData((prev) => ({ ...prev, education: updatedEducation }));
  };

  const removeEducation = (index: number) => {
    const updatedEducation = formData.education.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, education: updatedEducation }));
  };

  // Helper function to get already selected degrees (excluding current index)
  const getSelectedDegrees = (currentIndex: number) => {
    return formData.education
      .map((edu, index) => (index !== currentIndex ? edu.degree : null))
      .filter((degree) => degree && degree !== "");
  };

  // Experience handlers
  const addExperience = (type: "IT" | "NON_IT") => {
    const newExperience = {
      company: "",
      role: "",
      startDate: "",
      endDate: "",
      description: "",
      type,
    };

    if (type === "IT") {
      setFormData((prev) => ({
        ...prev,
        itExperience: [...prev.itExperience, newExperience],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        nonItExperience: [...prev.nonItExperience, newExperience],
      }));
    }
  };

  const updateExperience = (
    type: "IT" | "NON_IT",
    index: number,
    field: keyof Experience,
    value: string
  ) => {
    if (type === "IT") {
      const updatedExperience = [...formData.itExperience];
      updatedExperience[index] = {
        ...updatedExperience[index],
        [field]: value,
      };
      setFormData((prev) => ({ ...prev, itExperience: updatedExperience }));
    } else {
      const updatedExperience = [...formData.nonItExperience];
      updatedExperience[index] = {
        ...updatedExperience[index],
        [field]: value,
      };
      setFormData((prev) => ({ ...prev, nonItExperience: updatedExperience }));
    }
  };

  const removeExperience = (type: "IT" | "NON_IT", index: number) => {
    if (type === "IT") {
      const updatedExperience = formData.itExperience.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({ ...prev, itExperience: updatedExperience }));
    } else {
      const updatedExperience = formData.nonItExperience.filter(
        (_, i) => i !== index
      );
      setFormData((prev) => ({ ...prev, nonItExperience: updatedExperience }));
    }
  };

  // Career Gap handlers
  const addCareerGap = () => {
    setFormData((prev) => ({
      ...prev,
      careerGaps: [
        ...prev.careerGaps,
        { startDate: "", endDate: "", reason: "" },
      ],
    }));
  };

  const updateCareerGap = (
    index: number,
    field: keyof CareerGap,
    value: string
  ) => {
    const updatedGaps = [...formData.careerGaps];
    updatedGaps[index] = { ...updatedGaps[index], [field]: value };
    setFormData((prev) => ({ ...prev, careerGaps: updatedGaps }));
  };

  const removeCareerGap = (index: number) => {
    const updatedGaps = formData.careerGaps.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, careerGaps: updatedGaps }));
  };

  // Skill handlers
  const addSkill = () => {
    setFormData((prev) => ({
      ...prev,
      skills: [
        ...prev.skills,
        {
          name: "",
          type: "IT",
          proficiency: "INTERMEDIATE",
          acquiredDuring: "BEFORE_TRAINING",
        },
      ],
    }));
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updatedSkills = [...formData.skills];
    const skillToUpdate = { ...updatedSkills[index] };

    // Type assertion to ensure value matches the expected literal types for specific fields
    if (field === "type") {
      skillToUpdate[field] = value as "IT" | "NON_IT";
    } else if (field === "proficiency") {
      skillToUpdate[field] = value as
        | "BEGINNER"
        | "INTERMEDIATE"
        | "ADVANCED"
        | "EXPERT";
    } else if (field === "acquiredDuring") {
      skillToUpdate[field] = value as "BEFORE_TRAINING" | "DURING_TRAINING";
    } else {
      skillToUpdate[field] = value;
    }

    updatedSkills[index] = skillToUpdate;
    setFormData((prev) => ({ ...prev, skills: updatedSkills }));
  };

  const removeSkill = (index: number) => {
    const updatedSkills = formData.skills.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, skills: updatedSkills }));
  };

  if (loading && !id) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <FloatingParticles />
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h1
          className="text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {id ? "Edit Candidate" : "Add New Candidate"}
        </motion.h1>
        <motion.p
          className="text-gray-600 mt-1"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {id
            ? "Update candidate information"
            : "Create a new candidate profile"}
        </motion.p>
      </motion.div>

      {error && (
        <motion.div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded"
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <p>{error}</p>
        </motion.div>
      )}

      {success && (
        <motion.div
          className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded"
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
        >
          <p>{success}</p>
        </motion.div>
      )}

      <motion.div
        className="bg-white rounded-lg shadow-md overflow-hidden"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.5 }}
      >
        {/* Tabs */}
        <motion.div
          className="border-b border-gray-200"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <nav className="-mb-px flex">
            <motion.button
              onClick={() => setActiveTab("personal")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "personal"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.7 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Personal Information
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("education")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "education"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.8 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Education
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("experience")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "experience"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.9 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Experience
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("skills")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "skills"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 1.0 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Skills
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("documents")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
                activeTab === "documents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 1.1 }}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Documents
            </motion.button>
          </nav>
        </motion.div>

        <motion.form
          onSubmit={handleSubmit}
          className="p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          {/* Personal Information */}
          {activeTab === "personal" && (
            <motion.div
              className="space-y-8"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.4 }}
            >
              {/* Basic Information Section */}
              <div className="bg-blue-50 border-l-4 border-blue-400 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                  Basic Information
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Full Name *
                    </label>
                    <motion.input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      whileFocus={{
                        scale: 1.02,
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      }}
                    />
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                  >
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email *
                    </label>
                    <motion.input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-200"
                      whileFocus={{
                        scale: 1.02,
                        boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                      }}
                    />
                  </motion.div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Date of Birth
                    </label>
                    <input
                      type="date"
                      name="dateOfBirth"
                      value={formData.dateOfBirth}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Gender
                    </label>
                    <select
                      name="gender"
                      value={formData.gender}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="status"
                      value={formData.status}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="ACTIVE">Active</option>
                      <option value="IN_TRAINING">In Training</option>
                      <option value="DEPLOYED">Deployed</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="TERMINATED">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Address Information Section */}
              <div className="bg-orange-50 border-l-4 border-orange-400 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                  Address Information
                </h4>
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      State *
                    </label>
                    <Autocomplete
                      options={states}
                      value={formData.state}
                      onChange={(value) => {
                        const state = states.find((s) => s.value === value);
                        setSelectedState(state || null);
                        setFormData((prev) => ({
                          ...prev,
                          state: value,
                          city: "",
                          pincode: "",
                        }));
                        if (state) {
                          loadCitiesForState(value);
                        }
                      }}
                      placeholder="Search and select state..."
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      City *
                    </label>
                    <Autocomplete
                      options={cities}
                      value={formData.city}
                      onChange={(value) => {
                        const city = cities.find((c) => c.value === value);
                        setSelectedCity(city || null);
                        setFormData((prev) => ({
                          ...prev,
                          city: value,
                          pincode: "",
                        }));
                      }}
                      placeholder={
                        selectedState
                          ? "Search and select city..."
                          : "Select state first"
                      }
                      disabled={!selectedState}
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Pincode *
                    </label>
                    <Autocomplete
                      options={[]}
                      value={formData.pincode}
                      onChange={(value) => {
                        setFormData((prev) => ({ ...prev, pincode: value }));
                        if (isValidPincode(value)) {
                          getLocationByPincode(value).then((locationData) => {
                            if (locationData) {
                              const state = states.find(
                                (s) => s.label === locationData.state
                              );
                              const city = cities.find(
                                (c) => c.label === locationData.city
                              );
                              if (state) {
                                setSelectedState(state);
                                setFormData((prev) => ({
                                  ...prev,
                                  state: state.value,
                                }));
                                loadCitiesForState(state.value);
                              }
                              if (city) {
                                setSelectedCity(city);
                                setFormData((prev) => ({
                                  ...prev,
                                  city: city.value,
                                }));
                              }
                            }
                          });
                        }
                      }}
                      placeholder="Enter 6-digit pincode..."
                      className="w-full"
                      onInputChange={(inputValue) => {
                        setFormData((prev) => ({
                          ...prev,
                          pincode: inputValue,
                        }));
                      }}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Highest Qualification *
                    </label>
                    <select
                      name="highestQualification"
                      value={formData.highestQualification}
                      onChange={handleChange}
                      required
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Highest Qualification</option>
                      <optgroup label="School Education">
                        <option value="10th/SSC/SSLC">10th/SSC/SSLC</option>
                        <option value="12th/HSC/Intermediate">
                          12th/HSC/Intermediate
                        </option>
                      </optgroup>
                      <optgroup label="Undergraduate">
                        <option value="B.Tech/B.E.">B.Tech/B.E.</option>
                        <option value="B.Sc">B.Sc</option>
                        <option value="B.Com">B.Com</option>
                        <option value="B.A">B.A</option>
                        <option value="BBA">BBA</option>
                        <option value="BCA">BCA</option>
                      </optgroup>
                      <optgroup label="Postgraduate">
                        <option value="M.Tech/M.E.">M.Tech/M.E.</option>
                        <option value="M.Sc">M.Sc</option>
                        <option value="M.Com">M.Com</option>
                        <option value="M.A">M.A</option>
                        <option value="MBA">MBA</option>
                        <option value="MCA">MCA</option>
                      </optgroup>
                      <optgroup label="Doctoral">
                        <option value="Ph.D">Ph.D</option>
                      </optgroup>
                      <optgroup label="Diplomas">
                        <option value="Diploma">Diploma</option>
                        <option value="Advanced Diploma">
                          Advanced Diploma
                        </option>
                      </optgroup>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Previous Salary (₹)
                    </label>
                    <input
                      type="number"
                      name="previousSalary"
                      value={formData.previousSalary}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Expected Salary (₹)
                    </label>
                    <input
                      type="number"
                      name="expectedSalary"
                      value={formData.expectedSalary}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>

              {/* Additional Notes Section */}
              <div className="bg-gray-50 border-l-4 border-gray-400 p-6 rounded-lg">
                <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="w-2 h-2 bg-gray-500 rounded-full mr-2"></span>
                  Additional Notes
                </h4>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleChange}
                    rows={4}
                    className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Additional notes about the candidate..."
                  />
                </div>
              </div>
            </motion.div>
          )}

          {/* Education */}
          {activeTab === "education" && (
            <div className="space-y-8">
              {/* Education Section */}
              <div className="bg-emerald-50 border-l-4 border-emerald-400 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-emerald-800 flex items-center">
                    <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                    Education Details
                  </h4>
                  <button
                    type="button"
                    onClick={addEducation}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white py-2 px-4 rounded-md text-sm flex items-center transition-colors duration-200"
                  >
                    <FaPlus className="mr-1" /> Add Education
                  </button>
                </div>

                {formData.education.length === 0 ? (
                  <div className="text-center py-4 text-gray-500">
                    No education details added. Click "Add Education" to add
                    details.
                  </div>
                ) : (
                  formData.education.map((edu, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-md relative"
                    >
                      <button
                        type="button"
                        onClick={() => removeEducation(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Degree/Certificate *
                          </label>
                          <select
                            value={edu.degree}
                            onChange={(e) =>
                              updateEducation(index, "degree", e.target.value)
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Degree/Certificate</option>
                            <optgroup label="School Education">
                              <option
                                value="10th/SSC/SSLC"
                                disabled={getSelectedDegrees(index).includes(
                                  "10th/SSC/SSLC"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "10th/SSC/SSLC"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("10th/SSC/SSLC")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                10th/SSC/SSLC{" "}
                                {getSelectedDegrees(index).includes(
                                  "10th/SSC/SSLC"
                                )
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="12th/HSC/Intermediate"
                                disabled={getSelectedDegrees(index).includes(
                                  "12th/HSC/Intermediate"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "12th/HSC/Intermediate"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("12th/HSC/Intermediate")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                12th/HSC/Intermediate{" "}
                                {getSelectedDegrees(index).includes(
                                  "12th/HSC/Intermediate"
                                )
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                            </optgroup>
                            <optgroup label="Undergraduate">
                              <option
                                value="B.Tech/B.E."
                                disabled={getSelectedDegrees(index).includes(
                                  "B.Tech/B.E."
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "B.Tech/B.E."
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("B.Tech/B.E.")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                B.Tech/B.E.{" "}
                                {getSelectedDegrees(index).includes(
                                  "B.Tech/B.E."
                                )
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="B.Sc"
                                disabled={getSelectedDegrees(index).includes(
                                  "B.Sc"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "B.Sc"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("B.Sc")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                B.Sc{" "}
                                {getSelectedDegrees(index).includes("B.Sc")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="B.Com"
                                disabled={getSelectedDegrees(index).includes(
                                  "B.Com"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "B.Com"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("B.Com")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                B.Com{" "}
                                {getSelectedDegrees(index).includes("B.Com")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="B.A"
                                disabled={getSelectedDegrees(index).includes(
                                  "B.A"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "B.A"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("B.A")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                B.A{" "}
                                {getSelectedDegrees(index).includes("B.A")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="BBA"
                                disabled={getSelectedDegrees(index).includes(
                                  "BBA"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "BBA"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("BBA")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                BBA{" "}
                                {getSelectedDegrees(index).includes("BBA")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="BCA"
                                disabled={getSelectedDegrees(index).includes(
                                  "BCA"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "BCA"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("BCA")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                BCA{" "}
                                {getSelectedDegrees(index).includes("BCA")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                            </optgroup>
                            <optgroup label="Postgraduate">
                              <option
                                value="M.Tech/M.E."
                                disabled={getSelectedDegrees(index).includes(
                                  "M.Tech/M.E."
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "M.Tech/M.E."
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("M.Tech/M.E.")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                M.Tech/M.E.{" "}
                                {getSelectedDegrees(index).includes(
                                  "M.Tech/M.E."
                                )
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="M.Sc"
                                disabled={getSelectedDegrees(index).includes(
                                  "M.Sc"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "M.Sc"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("M.Sc")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                M.Sc{" "}
                                {getSelectedDegrees(index).includes("M.Sc")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="M.Com"
                                disabled={getSelectedDegrees(index).includes(
                                  "M.Com"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "M.Com"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("M.Com")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                M.Com{" "}
                                {getSelectedDegrees(index).includes("M.Com")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="M.A"
                                disabled={getSelectedDegrees(index).includes(
                                  "M.A"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "M.A"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("M.A")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                M.A{" "}
                                {getSelectedDegrees(index).includes("M.A")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="MBA"
                                disabled={getSelectedDegrees(index).includes(
                                  "MBA"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "MBA"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("MBA")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                MBA{" "}
                                {getSelectedDegrees(index).includes("MBA")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="MCA"
                                disabled={getSelectedDegrees(index).includes(
                                  "MCA"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "MCA"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("MCA")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                MCA{" "}
                                {getSelectedDegrees(index).includes("MCA")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                            </optgroup>
                            <optgroup label="Doctoral">
                              <option
                                value="Ph.D"
                                disabled={getSelectedDegrees(index).includes(
                                  "Ph.D"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "Ph.D"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("Ph.D")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                Ph.D{" "}
                                {getSelectedDegrees(index).includes("Ph.D")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                            </optgroup>
                            <optgroup label="Diplomas">
                              <option
                                value="Diploma"
                                disabled={getSelectedDegrees(index).includes(
                                  "Diploma"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "Diploma"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("Diploma")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                Diploma{" "}
                                {getSelectedDegrees(index).includes("Diploma")
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="Advanced Diploma"
                                disabled={getSelectedDegrees(index).includes(
                                  "Advanced Diploma"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "Advanced Diploma"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("Advanced Diploma")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                Advanced Diploma{" "}
                                {getSelectedDegrees(index).includes(
                                  "Advanced Diploma"
                                )
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                            </optgroup>
                            <optgroup label="Certifications">
                              <option
                                value="Professional Certificate"
                                disabled={getSelectedDegrees(index).includes(
                                  "Professional Certificate"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "Professional Certificate"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("Professional Certificate")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                Professional Certificate{" "}
                                {getSelectedDegrees(index).includes(
                                  "Professional Certificate"
                                )
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                              <option
                                value="Industry Certification"
                                disabled={getSelectedDegrees(index).includes(
                                  "Industry Certification"
                                )}
                                style={{
                                  color: getSelectedDegrees(index).includes(
                                    "Industry Certification"
                                  )
                                    ? "#9CA3AF"
                                    : "inherit",
                                  backgroundColor: getSelectedDegrees(
                                    index
                                  ).includes("Industry Certification")
                                    ? "#F3F4F6"
                                    : "inherit",
                                }}
                              >
                                Industry Certification{" "}
                                {getSelectedDegrees(index).includes(
                                  "Industry Certification"
                                )
                                  ? "(Already Added)"
                                  : ""}
                              </option>
                            </optgroup>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Institution *
                          </label>
                          <input
                            type="text"
                            value={edu.institution}
                            onChange={(e) =>
                              updateEducation(
                                index,
                                "institution",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Field of Study *
                          </label>
                          <select
                            value={edu.fieldOfStudy}
                            onChange={(e) =>
                              updateEducation(
                                index,
                                "fieldOfStudy",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Field of Study</option>
                            <optgroup label="Engineering & Technology">
                              <option value="Computer Science Engineering">
                                Computer Science Engineering
                              </option>
                              <option value="Information Technology">
                                Information Technology
                              </option>
                              <option value="Electronics & Communication">
                                Electronics & Communication
                              </option>
                              <option value="Mechanical Engineering">
                                Mechanical Engineering
                              </option>
                              <option value="Civil Engineering">
                                Civil Engineering
                              </option>
                              <option value="Electrical Engineering">
                                Electrical Engineering
                              </option>
                            </optgroup>
                            <optgroup label="Science">
                              <option value="Computer Science">
                                Computer Science
                              </option>
                              <option value="Physics">Physics</option>
                              <option value="Chemistry">Chemistry</option>
                              <option value="Mathematics">Mathematics</option>
                              <option value="Biology">Biology</option>
                            </optgroup>
                            <optgroup label="Commerce & Management">
                              <option value="Commerce">Commerce</option>
                              <option value="Business Administration">
                                Business Administration
                              </option>
                              <option value="Finance">Finance</option>
                              <option value="Marketing">Marketing</option>
                              <option value="Human Resources">
                                Human Resources
                              </option>
                            </optgroup>
                            <optgroup label="Arts & Humanities">
                              <option value="English">English</option>
                              <option value="History">History</option>
                              <option value="Political Science">
                                Political Science
                              </option>
                              <option value="Psychology">Psychology</option>
                              <option value="Sociology">Sociology</option>
                            </optgroup>
                            <optgroup label="Other">
                              <option value="General Studies">
                                General Studies
                              </option>
                              <option value="Other">Other</option>
                            </optgroup>
                          </select>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Year of Passing *
                          </label>
                          <select
                            value={edu.yearOfPassing}
                            onChange={(e) =>
                              updateEducation(
                                index,
                                "yearOfPassing",
                                parseInt(e.target.value)
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Select Year</option>
                            {Array.from(
                              { length: new Date().getFullYear() - 1949 },
                              (_, i) => {
                                const year = new Date().getFullYear() - i;
                                return (
                                  <option key={year} value={year}>
                                    {year}
                                  </option>
                                );
                              }
                            )}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Percentage/CGPA *
                          </label>
                          <input
                            type="number"
                            value={edu.percentage}
                            onChange={(e) =>
                              updateEducation(
                                index,
                                "percentage",
                                parseFloat(e.target.value)
                              )
                            }
                            required
                            min="0"
                            max="100"
                            step="0.01"
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Experience */}
          {activeTab === "experience" && (
            <div className="space-y-8">
              {/* IT Experience Section */}
              <div className="bg-cyan-50 border-l-4 border-cyan-400 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-cyan-800 flex items-center">
                    <span className="w-2 h-2 bg-cyan-500 rounded-full mr-2"></span>
                    IT Experience
                  </h4>
                  <button
                    type="button"
                    onClick={() => addExperience("IT")}
                    className="bg-cyan-600 hover:bg-cyan-700 text-white py-2 px-4 rounded-md text-sm flex items-center transition-colors duration-200"
                  >
                    <FaPlus className="mr-1" /> Add IT Experience
                  </button>
                </div>

                {formData.itExperience.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                    No IT experience added. Click "Add IT Experience" to add
                    details.
                  </div>
                ) : (
                  formData.itExperience.map((exp, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-md relative mb-4"
                    >
                      <button
                        type="button"
                        onClick={() => removeExperience("IT", index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company *
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) =>
                              updateExperience(
                                "IT",
                                index,
                                "company",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role/Position *
                          </label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) =>
                              updateExperience(
                                "IT",
                                index,
                                "role",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) =>
                              updateExperience(
                                "IT",
                                index,
                                "startDate",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={exp.endDate}
                            onChange={(e) =>
                              updateExperience(
                                "IT",
                                index,
                                "endDate",
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={exp.description}
                          onChange={(e) =>
                            updateExperience(
                              "IT",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Non-IT Experience Section */}
              <div className="bg-teal-50 border-l-4 border-teal-400 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-teal-800 flex items-center">
                    <span className="w-2 h-2 bg-teal-500 rounded-full mr-2"></span>
                    Non-IT Experience
                  </h4>
                  <button
                    type="button"
                    onClick={() => addExperience("NON_IT")}
                    className="bg-teal-600 hover:bg-teal-700 text-white py-2 px-4 rounded-md text-sm flex items-center transition-colors duration-200"
                  >
                    <FaPlus className="mr-1" /> Add Non-IT Experience
                  </button>
                </div>

                {formData.nonItExperience.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                    No Non-IT experience added. Click "Add Non-IT Experience" to
                    add details.
                  </div>
                ) : (
                  formData.nonItExperience.map((exp, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-md relative mb-4"
                    >
                      <button
                        type="button"
                        onClick={() => removeExperience("NON_IT", index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company *
                          </label>
                          <input
                            type="text"
                            value={exp.company}
                            onChange={(e) =>
                              updateExperience(
                                "NON_IT",
                                index,
                                "company",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Role/Position *
                          </label>
                          <input
                            type="text"
                            value={exp.role}
                            onChange={(e) =>
                              updateExperience(
                                "NON_IT",
                                index,
                                "role",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={exp.startDate}
                            onChange={(e) =>
                              updateExperience(
                                "NON_IT",
                                index,
                                "startDate",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                          </label>
                          <input
                            type="date"
                            value={exp.endDate}
                            onChange={(e) =>
                              updateExperience(
                                "NON_IT",
                                index,
                                "endDate",
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Description
                        </label>
                        <textarea
                          value={exp.description}
                          onChange={(e) =>
                            updateExperience(
                              "NON_IT",
                              index,
                              "description",
                              e.target.value
                            )
                          }
                          rows={3}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Career Gaps Section */}
              <div className="bg-amber-50 border-l-4 border-amber-400 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-amber-800 flex items-center">
                    <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
                    Career Gaps
                  </h4>
                  <button
                    type="button"
                    onClick={addCareerGap}
                    className="bg-amber-600 hover:bg-amber-700 text-white py-2 px-4 rounded-md text-sm flex items-center transition-colors duration-200"
                  >
                    <FaPlus className="mr-1" /> Add Career Gap
                  </button>
                </div>

                {formData.careerGaps.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                    No career gaps added. Click "Add Career Gap" to add details.
                  </div>
                ) : (
                  formData.careerGaps.map((gap, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-4 rounded-md relative mb-4"
                    >
                      <button
                        type="button"
                        onClick={() => removeCareerGap(index)}
                        className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                      >
                        <FaTrash />
                      </button>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date *
                          </label>
                          <input
                            type="date"
                            value={gap.startDate}
                            onChange={(e) =>
                              updateCareerGap(
                                index,
                                "startDate",
                                e.target.value
                              )
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            End Date *
                          </label>
                          <input
                            type="date"
                            value={gap.endDate}
                            onChange={(e) =>
                              updateCareerGap(index, "endDate", e.target.value)
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Reason *
                        </label>
                        <textarea
                          value={gap.reason}
                          onChange={(e) =>
                            updateCareerGap(index, "reason", e.target.value)
                          }
                          required
                          rows={2}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Skills */}
          {activeTab === "skills" && (
            <div className="space-y-8">
              {/* Skills Section */}
              <div className="bg-rose-50 border-l-4 border-rose-400 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-rose-800 flex items-center">
                    <span className="w-2 h-2 bg-rose-500 rounded-full mr-2"></span>
                    Skills
                  </h4>
                  <button
                    type="button"
                    onClick={addSkill}
                    className="bg-rose-600 hover:bg-rose-700 text-white py-2 px-4 rounded-md text-sm flex items-center transition-colors duration-200"
                  >
                    <FaPlus className="mr-1" /> Add Skill
                  </button>
                </div>

                {formData.skills.length === 0 ? (
                  <div className="text-center py-4 text-gray-500 bg-gray-50 rounded-md">
                    No skills added. Click "Add Skill" to add details.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.skills.map((skill, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-md relative"
                      >
                        <button
                          type="button"
                          onClick={() => removeSkill(index)}
                          className="absolute top-2 right-2 text-red-600 hover:text-red-800"
                        >
                          <FaTrash />
                        </button>

                        <div className="mb-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Skill Name *
                          </label>
                          <input
                            type="text"
                            value={skill.name}
                            onChange={(e) =>
                              updateSkill(index, "name", e.target.value)
                            }
                            required
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Type
                            </label>
                            <select
                              value={skill.type}
                              onChange={(e) =>
                                updateSkill(index, "type", e.target.value)
                              }
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="IT">IT</option>
                              <option value="NON_IT">Non-IT</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Proficiency
                            </label>
                            <select
                              value={skill.proficiency}
                              onChange={(e) =>
                                updateSkill(
                                  index,
                                  "proficiency",
                                  e.target.value
                                )
                              }
                              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                              <option value="BEGINNER">Beginner</option>
                              <option value="INTERMEDIATE">Intermediate</option>
                              <option value="ADVANCED">Advanced</option>
                              <option value="EXPERT">Expert</option>
                            </select>
                          </div>
                        </div>

                        <div className="mt-3">
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Acquired During
                          </label>
                          <select
                            value={skill.acquiredDuring}
                            onChange={(e) =>
                              updateSkill(
                                index,
                                "acquiredDuring",
                                e.target.value
                              )
                            }
                            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="BEFORE_TRAINING">
                              Before Training
                            </option>
                            <option value="DURING_TRAINING">
                              During Training
                            </option>
                          </select>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Documents */}
          {activeTab === "documents" && (
            <div className="space-y-8">
              {/* Documents Section */}
              <div className="bg-violet-50 border-l-4 border-violet-400 p-6 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h4 className="text-lg font-semibold text-violet-800 flex items-center">
                    <span className="w-2 h-2 bg-violet-500 rounded-full mr-2"></span>
                    Documents
                  </h4>
                  <div className="text-sm text-violet-700">
                    Upload your documents below
                  </div>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Resume
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={(e) => handleFileChange(e, "RESUME")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadProgress["RESUME"] && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress["RESUME"]}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress["RESUME"]}% uploaded
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Offer Letter
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "OFFER_LETTER")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadProgress["OFFER_LETTER"] && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${uploadProgress["OFFER_LETTER"]}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress["OFFER_LETTER"]}% uploaded
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Relieving Letter
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "RELIEVING_LETTER")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadProgress["RELIEVING_LETTER"] && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${uploadProgress["RELIEVING_LETTER"]}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress["RELIEVING_LETTER"]}% uploaded
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  ID Proof
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "ID_PROOF")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadProgress["ID_PROOF"] && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress["ID_PROOF"]}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress["ID_PROOF"]}% uploaded
                    </p>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Card
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "AADHAR")}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadProgress["AADHAR"] && (
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${uploadProgress["AADHAR"]}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadProgress["AADHAR"]}% uploaded
                      </p>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PAN Card
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => handleFileChange(e, "PAN")}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                  {uploadProgress["PAN"] && (
                    <div className="mt-2">
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${uploadProgress["PAN"]}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {uploadProgress["PAN"]}% uploaded
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bank Statement
                </label>
                <input
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "BANK_STATEMENT")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadProgress["BANK_STATEMENT"] && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{
                          width: `${uploadProgress["BANK_STATEMENT"]}%`,
                        }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress["BANK_STATEMENT"]}% uploaded
                    </p>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 p-4 rounded-md">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Other Document
                </label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                  onChange={(e) => handleFileChange(e, "OTHER")}
                  className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                {uploadProgress["OTHER"] && (
                  <div className="mt-2">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div
                        className="bg-blue-600 h-2.5 rounded-full"
                        style={{ width: `${uploadProgress["OTHER"]}%` }}
                      ></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {uploadProgress["OTHER"]}% uploaded
                    </p>
                  </div>
                )}
              </div>

              {/* Existing Documents */}
              {id && formData.documents && formData.documents.length > 0 && (
                <div className="mt-8">
                  <h4 className="text-md font-medium text-gray-900 mb-4">
                    Uploaded Documents
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {formData.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between bg-gray-50 p-3 rounded-md"
                      >
                        <div>
                          <p className="font-medium text-gray-800">
                            {doc.name}
                          </p>
                          <p className="text-sm text-gray-500">{doc.type}</p>
                        </div>
                        <div className="flex space-x-2">
                          <a
                            href={doc.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm hover:bg-blue-200"
                          >
                            View
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => navigate("/htd/candidates")}
              className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition duration-300 ease-in-out"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 ease-in-out flex items-center ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading && (
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              )}
              {id ? "Update Candidate" : "Create Candidate"}
            </button>
          </div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default CandidateForm;
