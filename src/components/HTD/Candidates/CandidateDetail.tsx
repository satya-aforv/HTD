import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
  FaEdit,
  FaDownload,
  FaFilePdf,
  FaFileAlt,
  FaFileImage,
  FaUser,
  FaEnvelope,
  FaPhone,
  FaBirthdayCake,
  FaVenusMars,
  FaMapMarkerAlt,
  FaGraduationCap,
  FaBriefcase,
  FaCode,
  FaFileSignature,
  FaSpinner,
} from "react-icons/fa";
import { getStatusBadge } from "../../Common/StatusBadge";
import api from "@/services/htdAPI";

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
  phone?: string;
  contactNumber?: string;
  dateOfBirth: string;
  gender: string;
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
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
        const response = await api.getCandidate(id);
        console.log("Candidate data:", response);
        setCandidate(response);
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
        `${candidate?.name?.replace(/\s+/g, "_") || "candidate"}_Profile.pdf`
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
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    } catch (error: unknown) {
      return "Invalid Date";
    }
  };

  const calculateExperienceDuration = (startDate: string, endDate: string) => {
    if (!startDate) return "N/A";

    try {
      const start = new Date(startDate);
      const end = endDate ? new Date(endDate) : new Date();

      // Handle invalid dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) return "N/A";

      const diffTime = Math.abs(end.getTime() - start.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const years = Math.floor(diffDays / 365);
      const months = Math.floor((diffDays % 365) / 30);

      if (years === 0 && months === 0) return "Less than a month";

      return `${years} year${years !== 1 ? "s" : ""} ${months} month${
        months !== 1 ? "s" : ""
      }`;
    } catch (error) {
      return "N/A";
    }
  };

  const getDocumentIcon = (docType: string) => {
    if (!docType) return <FaFileAlt className="text-gray-500" />;

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

  // Calculate total experience in years and months
  const formatTotalExperience = (months: number | undefined) => {
    if (!months || months === 0) return "None";

    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;

    if (years === 0)
      return `${remainingMonths} month${remainingMonths !== 1 ? "s" : ""}`;
    if (remainingMonths === 0) return `${years} year${years !== 1 ? "s" : ""}`;

    return `${years} year${years !== 1 ? "s" : ""} ${remainingMonths} month${
      remainingMonths !== 1 ? "s" : ""
    }`;
  };

  if (loading) {
    return (
      <div className="p-6 flex flex-col justify-center items-center min-h-64">
        <FaSpinner className="animate-spin text-4xl text-blue-600 mb-3" />
        <p className="text-gray-600">Loading candidate details...</p>
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
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-gray-800 break-words">
            {candidate.name || "Unnamed Candidate"}
          </h1>
          <div className="mt-1">
            {getStatusBadge(candidate.status?.replace(/_/g, " ") || "Unknown")}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={handleGenerateProfile}
            disabled={generatingProfile}
            className={`bg-green-600 hover:bg-green-700 text-white py-2 px-3 md:px-4 rounded-md flex items-center text-sm ${
              generatingProfile ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            {generatingProfile ? (
              <>
                <FaSpinner className="animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <FaDownload className="mr-2" /> Generate
              </>
            )}
          </button>
          {profileUrl && (
            <a
              href={profileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 md:px-4 rounded-md flex items-center text-sm"
            >
              <FaFilePdf className="mr-2" /> View PDF
            </a>
          )}
          <button
            onClick={handleEdit}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-3 md:px-4 rounded-md flex items-center text-sm"
          >
            <FaEdit className="mr-2" /> Edit
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="border-b border-gray-200 overflow-x-auto">
          <nav className="flex min-w-max">
            {["overview", "education", "experience", "skills", "documents"].map(
              (tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-3 px-4 text-center border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? "border-blue-500 text-blue-600"
                      : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              )
            )}
          </nav>
        </div>

        <div className="p-4 md:p-6">
          {/* Overview Tab */}
          {activeTab === "overview" && (
            <div className="space-y-6 md:space-y-8">
              {/* Personal Information */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaUser className="mr-2 text-blue-500" /> Personal Information
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <FaUser className="mr-1" /> Full Name
                    </p>
                    <p className="mt-1 text-gray-900">
                      {candidate.name || "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <FaEnvelope className="mr-1" /> Email
                    </p>
                    <p className="mt-1 text-gray-900 break-all">
                      {candidate.email || "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <FaPhone className="mr-1" /> Phone
                    </p>
                    <p className="mt-1 text-gray-900">
                      {candidate.phone ||
                        candidate.contactNumber ||
                        "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <FaBirthdayCake className="mr-1" /> Date of Birth
                    </p>
                    <p className="mt-1 text-gray-900">
                      {candidate.dateOfBirth
                        ? formatDate(candidate.dateOfBirth)
                        : "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <FaVenusMars className="mr-1" /> Gender
                    </p>
                    <p className="mt-1 text-gray-900">
                      {candidate.gender || "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">Status</p>
                    <div className="mt-1">
                      {getStatusBadge(
                        candidate.status?.replace(/_/g, " ") || "Unknown"
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Address */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaMapMarkerAlt className="mr-2 text-blue-500" /> Address
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-gray-50 p-3 rounded-md sm:col-span-2">
                    <p className="text-sm font-medium text-gray-500">
                      Street Address
                    </p>
                    <p className="mt-1 text-gray-900">
                      {candidate.address?.street || "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">City</p>
                    <p className="mt-1 text-gray-900">
                      {candidate.address?.city || "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">State</p>
                    <p className="mt-1 text-gray-900">
                      {candidate.address?.state || "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">Pincode</p>
                    <p className="mt-1 text-gray-900">
                      {candidate.address?.pincode || "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">Country</p>
                    <p className="mt-1 text-gray-900">
                      {candidate.address?.country || "Not provided"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Professional Summary */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaBriefcase className="mr-2 text-blue-500" /> Professional
                  Summary
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500 flex items-center">
                      <FaGraduationCap className="mr-1" /> Highest Qualification
                    </p>
                    <p className="mt-1 text-gray-900">
                      {candidate.highestQualification || "Not provided"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">
                      Total IT Experience
                    </p>
                    <p className="mt-1 text-gray-900">
                      {formatTotalExperience(candidate.totalItExperience)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">
                      Total Non-IT Experience
                    </p>
                    <p className="mt-1 text-gray-900">
                      {formatTotalExperience(candidate.totalNonItExperience)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">
                      Previous Salary
                    </p>
                    <p className="mt-1 text-gray-900">
                      ₹
                      {candidate.previousSalary?.toLocaleString("en-IN") || "0"}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-md">
                    <p className="text-sm font-medium text-gray-500">
                      Expected Salary
                    </p>
                    <p className="mt-1 text-gray-900">
                      ₹
                      {candidate.expectedSalary?.toLocaleString("en-IN") || "0"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {candidate.notes && (
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                    <FaFileSignature className="mr-2 text-blue-500" /> Notes
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <p className="whitespace-pre-line text-gray-900">
                      {candidate.notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Education Tab */}
          {activeTab === "education" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaGraduationCap className="mr-2 text-blue-500" /> Education
                History
              </h3>

              {!candidate.education || candidate.education.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">
                    No education details available
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {candidate.education.map((edu, index) => (
                    <div key={index} className="bg-gray-50 p-4 rounded-md">
                      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                        <div className="flex-1">
                          <h4 className="text-lg font-medium text-gray-900">
                            {edu.degree || "No degree specified"}
                          </h4>
                          <p className="text-gray-600">
                            {edu.institution || "Institution not specified"}
                          </p>
                          {edu.field && (
                            <p className="text-sm text-gray-600 mt-1">
                              Field: {edu.field}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-gray-900">
                            {edu.yearOfPassing || "Year not specified"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {edu.percentage
                              ? `${edu.percentage}%`
                              : "Percentage not specified"}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Experience Tab */}
          {activeTab === "experience" && (
            <div className="space-y-6 md:space-y-8">
              {/* IT Experience */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <FaCode className="mr-2 text-blue-500" /> IT Experience
                </h3>

                {!candidate.itExperience ||
                candidate.itExperience.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No IT experience available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {candidate.itExperience.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              {exp.role || "Role not specified"}
                            </h4>
                            <p className="text-gray-600">
                              {exp.company || "Company not specified"}
                            </p>
                            {exp.description && (
                              <p className="mt-3 text-gray-600 whitespace-pre-line text-sm">
                                {exp.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
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

                {!candidate.nonItExperience ||
                candidate.nonItExperience.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">
                      No Non-IT experience available
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {candidate.nonItExperience.map((exp, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              {exp.role || "Role not specified"}
                            </h4>
                            <p className="text-gray-600">
                              {exp.company || "Company not specified"}
                            </p>
                            {exp.description && (
                              <p className="mt-3 text-gray-600 whitespace-pre-line text-sm">
                                {exp.description}
                              </p>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
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

                {!candidate.careerGaps || candidate.careerGaps.length === 0 ? (
                  <div className="text-center py-8 bg-gray-50 rounded-md">
                    <p className="text-gray-500">No career gaps recorded</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {candidate.careerGaps.map((gap, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="flex flex-col md:flex-row justify-between items-start gap-3">
                          <div className="flex-1">
                            <h4 className="text-lg font-medium text-gray-900">
                              Career Gap
                            </h4>
                            <p className="text-gray-600 mt-2 whitespace-pre-line">
                              {gap.reason || "No reason provided"}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900 whitespace-nowrap">
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
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaCode className="mr-2 text-blue-500" /> Skills
              </h3>

              {!candidate.skills || candidate.skills.length === 0 ? (
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
                    {candidate.skills.filter((skill) => skill.type === "IT")
                      .length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-500">No IT skills recorded</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {candidate.skills
                          .filter((skill) => skill.type === "IT")
                          .map((skill, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-md"
                            >
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-gray-900">
                                  {skill.name || "Unnamed Skill"}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getProficiencyBadgeClass(
                                    skill.proficiency
                                  )}`}
                                >
                                  {skill.proficiency || "UNKNOWN"}
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
                    )}
                  </div>

                  {/* Non-IT Skills */}
                  <div>
                    <h4 className="text-md font-medium text-gray-700 mb-3">
                      Non-IT Skills
                    </h4>
                    {candidate.skills.filter((skill) => skill.type === "NON_IT")
                      .length === 0 ? (
                      <div className="text-center py-4 bg-gray-50 rounded-md">
                        <p className="text-gray-500">
                          No Non-IT skills recorded
                        </p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {candidate.skills
                          .filter((skill) => skill.type === "NON_IT")
                          .map((skill, index) => (
                            <div
                              key={index}
                              className="bg-gray-50 p-3 rounded-md"
                            >
                              <div className="flex justify-between items-center">
                                <h5 className="font-medium text-gray-900">
                                  {skill.name || "Unnamed Skill"}
                                </h5>
                                <span
                                  className={`px-2 py-1 text-xs font-semibold rounded-full ${getProficiencyBadgeClass(
                                    skill.proficiency
                                  )}`}
                                >
                                  {skill.proficiency || "UNKNOWN"}
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
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Documents Tab */}
          {activeTab === "documents" && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaFileAlt className="mr-2 text-blue-500" /> Documents
              </h3>

              {!candidate.documents || candidate.documents.length === 0 ? (
                <div className="text-center py-8 bg-gray-50 rounded-md">
                  <p className="text-gray-500">No documents uploaded</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {candidate.documents.map((doc, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 p-3 rounded-md flex items-center justify-between"
                    >
                      <div className="flex items-center truncate">
                        <div className="mr-3 flex-shrink-0">
                          {getDocumentIcon(doc.type)}
                        </div>
                        <div className="truncate">
                          <h5 className="font-medium text-gray-900 truncate">
                            {doc.name || "Unnamed Document"}
                          </h5>
                          <p className="text-sm text-gray-600 truncate">
                            {doc.type || "Unknown type"}
                          </p>
                        </div>
                      </div>
                      <a
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-100 text-blue-700 px-3 py-1 rounded-md text-sm hover:bg-blue-200 flex items-center flex-shrink-0 ml-2"
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
