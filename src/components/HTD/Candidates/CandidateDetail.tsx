import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaEdit,
  FaDownload,
  FaFilePdf,
  FaFileAlt,
  FaFileImage,
} from "react-icons/fa";

interface Education {
  degree: string;
  institution: string;
  field: string;
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

interface Candidate {
  _id: string;
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
  createdAt: string;
  updatedAt: string;
  totalItExperience?: number;
  totalNonItExperience?: number;
}

const CandidateDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [generatingProfile, setGeneratingProfile] = useState<boolean>(false);
  const [profileUrl, setProfileUrl] = useState<string | null>(null);

  useEffect(() => {
    const fetchCandidate = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/candidates/${id}`);
        setCandidate(response.data);
        setError(null);
      } catch (err) {
        console.error("Error fetching candidate:", err);
        setError("Failed to load candidate data. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchCandidate();
    }
  }, [id]);

  const handleEdit = () => {
    navigate(`/htd/candidates/edit/${id}`);
  };

  const handleGenerateProfile = async () => {
    try {
      setGeneratingProfile(true);
      const response = await axios.get(
        `/api/candidates/${id}/generate-profile`,
        {
          responseType: "blob",
        }
      );

      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      setProfileUrl(url);

      // Create a link and trigger download
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `${candidate?.name.replace(/\s+/g, "_")}_Profile.pdf`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Error generating profile:", err);
      setError("Failed to generate candidate profile. Please try again.");
    } finally {
      setGeneratingProfile(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const calculateExperienceDuration = (startDate: string, endDate: string) => {
    if (!startDate) return "N/A";

    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const years = Math.floor(diffDays / 365);
    const months = Math.floor((diffDays % 365) / 30);

    return `${years} year${years !== 1 ? "s" : ""} ${months} month${
      months !== 1 ? "s" : ""
    }`;
  };

  const getDocumentIcon = (docType: string) => {
    const type = docType.toLowerCase();
    if (type.includes("pdf")) return <FaFilePdf className="text-red-500" />;
    if (type.includes("doc")) return <FaFileAlt className="text-blue-500" />;
    if (
      type.includes("image") ||
      type.includes("jpg") ||
      type.includes("png")
    ) {
      return <FaFileImage className="text-green-500" />;
    }
    return <FaFileAlt className="text-gray-500" />;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return "bg-green-100 text-green-800";
      case "IN_TRAINING":
        return "bg-blue-100 text-blue-800";
      case "DEPLOYED":
        return "bg-purple-100 text-purple-800";
      case "ON_HOLD":
        return "bg-yellow-100 text-yellow-800";
      case "TERMINATED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getProficiencyBadgeClass = (proficiency: string) => {
    switch (proficiency) {
      case "BEGINNER":
        return "bg-blue-100 text-blue-800";
      case "INTERMEDIATE":
        return "bg-green-100 text-green-800";
      case "ADVANCED":
        return "bg-purple-100 text-purple-800";
      case "EXPERT":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading candidate details...</p>
      </div>
    );
  }

  if (error || !candidate) {
    return (
      <div className="p-6">
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded">
          <p>{error || "Candidate not found"}</p>
        </div>
        <button
          onClick={() => navigate("/htd/candidates")}
          className="mt-4 bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md"
        >
          Back to Candidates
        </button>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800">
            {candidate?.name}
          </h1>
          <p className="text-gray-600">
            <span
              className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                candidate?.status
              )}`}
            >
              {candidate?.status?.replace("_", " ")}
            </span>
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleGenerateProfile}
            disabled={generatingProfile}
            className={`bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-md flex items-center ${
              generatingProfile ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {generatingProfile ? (
              <>
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
                Generating...
              </>
            ) : (
              <>
                <FaDownload className="mr-2" /> Generate Profile
              </>
            )}
          </button>
          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center"
          >
            <FaEdit className="mr-2" /> Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex">
            <button
              onClick={() => setActiveTab("overview")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "overview"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab("education")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "education"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Education
            </button>
            <button
              onClick={() => setActiveTab("experience")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "experience"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Experience
            </button>
            <button
              onClick={() => setActiveTab("skills")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "skills"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Skills
            </button>
            <button
              onClick={() => setActiveTab("documents")}
              className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                activeTab === "documents"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Documents
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Personal Information
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Full Name
                    </p>
                    <p className="mt-1">{candidate?.name || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Email</p>
                    <p className="mt-1">{candidate?.email || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Phone</p>
                    <p className="mt-1">{candidate?.phone || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Date of Birth
                    </p>
                    <p className="mt-1">
                      {candidate?.dateOfBirth
                        ? formatDate(candidate.dateOfBirth)
                        : "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Gender</p>
                    <p className="mt-1">{candidate?.gender || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <p className="mt-1">
                      <span
                        className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeClass(
                          candidate?.status
                        )}`}
                      >
                        {candidate?.status?.replace("_", " ")}
                      </span>
                    </p>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Address
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div className="md:col-span-2">
                    <p className="text-sm font-medium text-gray-500">
                      Street Address
                    </p>
                    <p className="mt-1">
                      {candidate?.address || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">City</p>
                    <p className="mt-1">{candidate?.city || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">State</p>
                    <p className="mt-1">{candidate?.state || "Not provided"}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Pincode</p>
                    <p className="mt-1">
                      {candidate?.pincode || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Professional Summary
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Highest Qualification
                    </p>
                    <p className="mt-1">
                      {candidate?.highestQualification || "Not provided"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total IT Experience
                    </p>
                    <p className="mt-1">
                      {candidate?.totalItExperience
                        ? `${candidate.totalItExperience} months`
                        : "None"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Total Non-IT Experience
                    </p>
                    <p className="mt-1">
                      {candidate?.totalNonItExperience
                        ? `${candidate.totalNonItExperience} months`
                        : "None"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Previous Salary
                    </p>
                    <p className="mt-1">
                      ₹
                      {candidate?.previousSalary?.toLocaleString("en-IN") ||
                        "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">
                      Expected Salary
                    </p>
                    <p className="mt-1">
                      ₹
                      {candidate?.expectedSalary?.toLocaleString("en-IN") ||
                        "0"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {candidate?.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Notes
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="whitespace-pre-line">{candidate?.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === "education" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Education History
              </h3>

              {candidate?.education?.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">
                    No education details available
                  </p>
                </div>
              ) : (
                <div className="space-y-6">
                  {candidate?.education?.map((edu, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="text-lg font-medium text-gray-900">
                            {edu.degree}
                          </h4>
                          <p className="text-gray-600">{edu.institution}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {edu.yearOfPassing}
                          </p>
                          <p className="text-sm text-gray-600">
                            {edu.percentage}%
                          </p>
                        </div>
                      </div>
                      {edu.field && (
                        <p className="mt-2 text-gray-600">
                          Field of Study: {edu.field}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div className="space-y-8">
              {/* IT Experience */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  IT Experience
                </h3>

                {candidate && candidate?.itExperience?.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No IT experience available</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {candidate?.itExperience?.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {exp.role}
                            </h4>
                            <p className="text-gray-600">{exp.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(exp.startDate)} -{" "}
                              {exp.endDate
                                ? formatDate(exp.endDate)
                                : "Present"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {calculateExperienceDuration(
                                exp.startDate,
                                exp.endDate
                              )}
                            </p>
                          </div>
                        </div>
                        {exp.description && (
                          <p className="mt-3 text-gray-600 whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Non-IT Experience */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Non-IT Experience
                </h3>

                {candidate?.nonItExperience?.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">
                      No Non-IT experience available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {candidate?.nonItExperience?.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              {exp.role}
                            </h4>
                            <p className="text-gray-600">{exp.company}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(exp.startDate)} -{" "}
                              {exp.endDate
                                ? formatDate(exp.endDate)
                                : "Present"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {calculateExperienceDuration(
                                exp.startDate,
                                exp.endDate
                              )}
                            </p>
                          </div>
                        </div>
                        {exp.description && (
                          <p className="mt-3 text-gray-600 whitespace-pre-line">
                            {exp.description}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Career Gaps */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Career Gaps
                </h3>

                {candidate?.careerGaps?.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No career gaps recorded</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {candidate?.careerGaps?.map((gap, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="text-lg font-medium text-gray-900">
                              Career Gap
                            </h4>
                            <p className="text-gray-600 mt-2 whitespace-pre-line">
                              {gap.reason}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(gap.startDate)} -{" "}
                              {formatDate(gap.endDate)}
                            </p>
                            <p className="text-sm text-gray-600">
                              {calculateExperienceDuration(
                                gap.startDate,
                                gap.endDate
                              )}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Skills Tab */}
          {activeTab === "skills" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Skills</h3>

              {candidate?.skills?.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No skills recorded</p>
                </div>
              ) : (
                <div>
                  {/* IT Skills */}
                  <div className="mb-8">
                    <h4 className="text-md font-medium text-gray-700 mb-3">
                      IT Skills
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {candidate &&
                        candidate?.skills &&
                        candidate?.skills
                          .filter((skill) => skill?.type === "IT")
                          .map((skill, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-4 rounded-md"
                            >
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-gray-900">
                                  {skill.name}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getProficiencyBadgeClass(
                                    skill.proficiency
                                  )}`}
                                >
                                  {skill.proficiency}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {skill.acquiredDuring === "BEFORE_TRAINING"
                                  ? "Prior Knowledge"
                                  : "Acquired During Training"}
                              </p>
                            </div>
                          ))}
                    </div>
                    {candidate &&
                      candidate?.skills &&
                      candidate.skills.filter((skill) => skill.type === "IT")
                        .length === 0 && (
                        <div className="text-center py-4 bg-gray-50 rounded-md">
                          <p className="text-gray-500">No IT skills recorded</p>
                        </div>
                      )}
                  </div>

                  {/* Non-IT Skills */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">
                      Non-IT Skills
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {candidate &&
                        candidate?.skills &&
                        candidate.skills
                          .filter((skill) => skill.type === "NON_IT")
                          .map((skill, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-4 rounded-md"
                            >
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-gray-900">
                                  {skill.name}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getProficiencyBadgeClass(
                                    skill.proficiency
                                  )}`}
                                >
                                  {skill.proficiency}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">
                                {skill.acquiredDuring === "BEFORE_TRAINING"
                                  ? "Prior Knowledge"
                                  : "Acquired During Training"}
                              </p>
                            </div>
                          ))}
                    </div>
                    {candidate &&
                      candidate?.skills &&
                      candidate.skills.filter(
                        (skill) => skill.type === "NON_IT"
                      ).length === 0 && (
                        <div className="text-center py-4 bg-gray-50 rounded-md">
                          <p className="text-gray-500">
                            No Non-IT skills recorded
                          </p>
                        </div>
                      )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Documents
              </h3>

              {candidate &&
              candidate?.documents &&
              candidate.documents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No documents uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {candidate &&
                    candidate?.documents &&
                    candidate.documents.map((doc, index) => (
                      <div
                        key={index}
                        className="bg-gray-50 p-4 rounded-md flex items-center justify-between"
                      >
                        <div className="flex items-center">
                          <div className="mr-3">
                            {getDocumentIcon(doc.type)}
                          </div>
                          <div>
                            <h5 className="font-medium text-gray-900">
                              {doc.name}
                            </h5>
                            <p className="text-sm text-gray-600">{doc.type}</p>
                          </div>
                        </div>
                        <a
                          href={doc.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm hover:bg-blue-200 flex items-center"
                        >
                          <FaDownload className="mr-1" /> View
                        </a>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CandidateDetail;
