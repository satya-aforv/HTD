/* eslint-disable @typescript-eslint/no-unused-expressions */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import type { AxiosProgressEvent } from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FaPlus, FaTrash } from "react-icons/fa";
import { useLocationData } from "../../../hooks/useLocationData";
import api from "../../../services/api";
import toast from "react-hot-toast";

// Define interfaces for type safety
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

// Single source of truth for CareerGap type
interface CareerGap {
  startDate: string;
  endDate: string;
  reason: string;
  country?: string;
  pincode?: string;
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

interface Address {
  street: string;
  city: string;
  state: string;
  pincode: string;
  country: string;
}

interface CandidateFormData {
  // Personal Information
  name: string;
  email: string;
  contactNumber: string;
  alternateContactNumber?: string;
  dateOfBirth: string;
  gender: string;

  // Address Information
  address: Address;

  // Professional Information
  status: string;
  highestQualification: string;
  previousSalary: number;
  expectedSalary: number;

  // Arrays
  education: Education[];
  itExperience: Experience[];
  nonItExperience: Experience[];
  careerGaps: CareerGap[];
  skills: Skill[];
  documents: Document[];

  // Additional
  notes: string;
  candidateId?: string;
}

const initialFormData: CandidateFormData = {
  // Personal Information
  name: "",
  email: "",
  contactNumber: "",
  alternateContactNumber: "",
  dateOfBirth: "",
  gender: "",

  // Address Information
  address: {
    street: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  },

  // Professional Information
  status: "HIRED",
  highestQualification: "",
  previousSalary: 0,
  expectedSalary: 0,

  // Arrays
  education: [],
  itExperience: [],
  nonItExperience: [],
  careerGaps: [],
  skills: [],
  documents: [],

  // Additional
  notes: "",
  candidateId: "",
};

const CandidateForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();

  // Form state with proper types
  const [formData, setFormData] = useState<CandidateFormData>(initialFormData);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  // Collect multiple error messages for top alert list
  const [errorList, setErrorList] = useState<string[]>([]);
  // Track invalid fields for per-field red borders (supports nested arrays by index)
  const [invalidFields, setInvalidFields] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<string>("personal");
  const [fileUploads, setFileUploads] = useState<Record<string, File | null>>(
    {}
  );
  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {}
  );

  // Location data
  const {
    states,
    cities,
    loadCitiesForState,
    searchPincodes,
    getLocationByPincode,
    isValidPincode,
  } = useLocationData();

  // Ordered tabs for step navigation
  const tabs = useMemo(
    () => ["personal", "education", "experience", "skills", "documents"],
    []
  );

  const isFirstTab = activeTab === tabs[0];
  const isLastTab = activeTab === tabs[tabs.length - 1];

  const goToNextTab = useCallback(() => {
    const idx = tabs.indexOf(activeTab);
    if (idx > -1 && idx < tabs.length - 1) setActiveTab(tabs[idx + 1]);
  }, [activeTab, tabs]);

  const goToPrevTab = useCallback(() => {
    const idx = tabs.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabs[idx - 1]);
  }, [activeTab, tabs]);

  // Email regex reused across validation and field checks
  const emailRegex = useMemo(() => /^[^\s@]+@[^\s@]+\.[^\s@]+$/, []);

  const isAdult = useCallback((dateStr: string): boolean => {
    if (!dateStr) return false;
    const dob = new Date(dateStr);
    if (Number.isNaN(dob.getTime())) return false;
    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const m = today.getMonth() - dob.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) age--;
    return age >= 18;
  }, []);

  const computeInvalidFields = useCallback(
    (fd: CandidateFormData): Record<string, boolean> => {
      const invalid: Record<string, boolean> = {};
      if (!fd.name?.trim()) invalid.name = true;
      if (!fd.email?.trim() || !emailRegex.test(fd.email)) invalid.email = true;
      if (!fd.contactNumber?.trim()) invalid.contactNumber = true;
      if (!fd.dateOfBirth || !isAdult(fd.dateOfBirth))
        invalid.dateOfBirth = true;
      // Newly added personal tab fields
      if (!fd.alternateContactNumber?.trim())
        invalid.alternateContactNumber = true;
      if (!fd.gender?.trim()) invalid.gender = true;
      if (!fd.highestQualification?.trim()) invalid.highestQualification = true;
      if (!Number.isFinite(fd.previousSalary)) invalid.previousSalary = true;
      if (!Number.isFinite(fd.expectedSalary)) invalid.expectedSalary = true;
      if (!fd.notes?.trim()) invalid.notes = true;
      return invalid;
    },
    [emailRegex, isAdult]
  );

  // Validate only the current tab.
  const validateCurrentTab = useCallback((): boolean => {
    const messages: string[] = [];
    const nextInvalid: Record<string, any> = {};

    if (activeTab === "personal") {
      const allInvalids = computeInvalidFields(formData);
      const keys = [
        "name",
        "email",
        "contactNumber",
        "alternateContactNumber",
        "dateOfBirth",
        "gender",
        "maritalStatus",
        "currentAddress",
        "permanentAddress",
        "currentCity",
        "permanentCity",
        "currentPincode",
        "permanentPincode",
        "currentState",
        "permanentState",
        "currentCountry",
        "permanentCountry",
        "highestQualification",
        "previousSalary",
        "expectedSalary",
        "notes",
      ] as const;
      keys.forEach((k) => {
        if (allInvalids[k]) {
          nextInvalid[k] = true;
          if (k === "name") messages.push("Full Name is required.");
          if (k === "email") messages.push("A valid Email is required.");
          if (k === "contactNumber") messages.push("Phone Number is required.");
          if (k === "alternateContactNumber")
            messages.push("Alternate Phone Number is required.");
          if (k === "dateOfBirth")
            messages.push("Date of Birth must indicate age 18 or above.");
          if (k === "gender") messages.push("Gender is required.");
          if (k === "maritalStatus")
            messages.push("Marital Status is required.");
          if (k === "currentAddress")
            messages.push("Current Address is required.");
          if (k === "permanentAddress")
            messages.push("Permanent Address is required.");
          if (k === "currentCity") messages.push("Current City is required.");
          if (k === "permanentCity")
            messages.push("Permanent City is required.");
          if (k === "currentPincode")
            messages.push("Current Pincode is required.");
          if (k === "permanentPincode")
            messages.push("Permanent Pincode is required.");
          if (k === "currentState") messages.push("Current State is required.");
          if (k === "permanentState")
            messages.push("Permanent State is required.");
          if (k === "currentCountry")
            messages.push("Current Country is required.");
          if (k === "permanentCountry")
            messages.push("Permanent Country is required.");
          if (k === "highestQualification")
            messages.push("Highest Qualification is required.");
          if (k === "previousSalary")
            messages.push("Previous Salary is required.");
          if (k === "expectedSalary")
            messages.push("Expected Salary is required.");
          if (k === "notes") messages.push("Notes is required.");
        }
      });
    }

    if (activeTab === "education") {
      formData.education.forEach((edu, idx) => {
        const rowInvalid: Record<string, boolean> = {};
        if (!String(edu.degree || "").trim())
          (rowInvalid.degree = true),
            messages.push(`Education #${idx + 1}: Degree is required.`);
        if (!String(edu.institution || "").trim())
          (rowInvalid.institution = true),
            messages.push(`Education #${idx + 1}: Institution is required.`);
        if (!String(edu.fieldOfStudy || "").trim())
          (rowInvalid.fieldOfStudy = true),
            messages.push(`Education #${idx + 1}: Field of Study is required.`);
        if (!Number.isFinite(edu.yearOfPassing))
          (rowInvalid.yearOfPassing = true),
            messages.push(
              `Education #${idx + 1}: Year of Passing is required.`
            );
        if (!Number.isFinite(edu.percentage))
          (rowInvalid.percentage = true),
            messages.push(
              `Education #${idx + 1}: Percentage/CGPA is required.`
            );
        if (Object.keys(rowInvalid).length) {
          nextInvalid.education = nextInvalid.education || {};
          nextInvalid.education[idx] = {
            ...(nextInvalid.education?.[idx] || {}),
            ...rowInvalid,
          };
        }
      });
    }

    if (activeTab === "experience") {
      const checkExp = (
        exp: Experience,
        idx: number,
        key: "itExperience" | "nonItExperience"
      ) => {
        const rowInvalid: Record<string, boolean> = {};
        if (!String(exp.company || "").trim())
          (rowInvalid.company = true),
            messages.push(
              `${key === "itExperience" ? "IT" : "Non-IT"} Experience #${
                idx + 1
              }: Company is required.`
            );
        if (!String(exp.role || "").trim())
          (rowInvalid.role = true),
            messages.push(
              `${key === "itExperience" ? "IT" : "Non-IT"} Experience #${
                idx + 1
              }: Role is required.`
            );
        if (!String(exp.startDate || "").trim())
          (rowInvalid.startDate = true),
            messages.push(
              `${key === "itExperience" ? "IT" : "Non-IT"} Experience #${
                idx + 1
              }: Start Date is required.`
            );
        if (Object.keys(rowInvalid).length) {
          nextInvalid[key] = nextInvalid[key] || {};
          nextInvalid[key][idx] = {
            ...(nextInvalid[key]?.[idx] || {}),
            ...rowInvalid,
          };
        }
      };

      formData.itExperience.forEach((exp, idx) =>
        checkExp(exp, idx, "itExperience")
      );
      formData.nonItExperience.forEach((exp, idx) =>
        checkExp(exp, idx, "nonItExperience")
      );

      formData.careerGaps.forEach((gap, idx) => {
        const rowInvalid: Record<string, boolean> = {};
        if (!String(gap.startDate || "").trim())
          (rowInvalid.startDate = true),
            messages.push(`Career Gap #${idx + 1}: Start Date is required.`);
        if (!String(gap.endDate || "").trim())
          (rowInvalid.endDate = true),
            messages.push(`Career Gap #${idx + 1}: End Date is required.`);
        if (!String(gap.reason || "").trim())
          (rowInvalid.reason = true),
            messages.push(`Career Gap #${idx + 1}: Reason is required.`);
        if (Object.keys(rowInvalid).length) {
          nextInvalid.careerGaps = nextInvalid.careerGaps || {};
          nextInvalid.careerGaps[idx] = {
            ...(nextInvalid.careerGaps?.[idx] || {}),
            ...rowInvalid,
          };
        }
      });
    }

    if (activeTab === "skills") {
      formData.skills.forEach((skill, idx) => {
        const rowInvalid: Record<string, boolean> = {};
        if (!String(skill.name || "").trim())
          (rowInvalid.name = true),
            messages.push(`Skill #${idx + 1}: Skill Name is required.`);
        if (Object.keys(rowInvalid).length) {
          nextInvalid.skills = nextInvalid.skills || {};
          nextInvalid.skills[idx] = {
            ...(nextInvalid.skills?.[idx] || {}),
            ...rowInvalid,
          };
        }
      });
    }

    if (Object.keys(nextInvalid).length > 0) {
      setInvalidFields((prev) => ({ ...prev, ...nextInvalid }));
      setError("Please fix the errors in this step.");
      setErrorList(
        messages.length ? messages : ["Please fix the highlighted fields."]
      );
      // Toast for step validation error (keep current tab as per UX rule)
      const desc = messages.length
        ? `${messages[0]}${
            messages.length > 1 ? ` (+${messages.length - 1} more)` : ""
          }`
        : "Please fix the highlighted fields.";
      toast.error(desc);
      return false;
    }
    return true;
  }, [activeTab, formData, computeInvalidFields]);

  const handleNextClick = useCallback(() => {
    const ok = validateCurrentTab();
    if (!ok) return; // keep current tab on failure
    const idx = tabs.indexOf(activeTab);
    if (idx < tabs.length - 1) {
      // Move to next tab and clear any previous tab errors/highlights
      setActiveTab(tabs[idx + 1]);
      setInvalidFields({});
      setError(null);
      setErrorList([]);
    }
  }, [activeTab, tabs, validateCurrentTab]);

  // Stable local max/min dates for DOB input
  // max = today - 18 years (must be at least 18)
  const dobMax = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 18);
    return d.toISOString().split("T")[0];
  }, []);

  // min = today - 100 years (reasonable lower bound)
  const dobMin = useMemo(() => {
    const d = new Date();
    d.setFullYear(d.getFullYear() - 100);
    return d.toISOString().split("T")[0];
  }, []);

  // Form field change handler with proper typing
  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
      >
    ): void => {
      const { name, value } = e.target;

      setFormData((prev: CandidateFormData) => {
        // Handle nested address fields
        if (name.startsWith("address.")) {
          const field = name.split(".")[1] as keyof Address;
          return {
            ...prev,
            address: {
              ...prev.address,
              [field]: value as string,
            },
          };
        }

        // Coerce numeric fields to numbers to avoid string/NaN issues
        if (name === "previousSalary" || name === "expectedSalary") {
          const num = value === "" ? 0 : Number(value);
          return {
            ...prev,
            [name]: Number.isFinite(num) ? num : 0,
          } as CandidateFormData;
        }

        // Handle other form fields
        return {
          ...prev,
          [name]: value,
        };
      });

      // Clear or set invalid flag live for core required fields
      if (name === "name") {
        const validNow = value.trim().length > 0;
        setInvalidFields((prev) => ({ ...prev, name: !validNow }));
      } else if (name === "email") {
        const validNow = value.trim().length > 0 && emailRegex.test(value);
        setInvalidFields((prev) => ({ ...prev, email: !validNow }));
      } else if (name === "contactNumber") {
        const validNow = value.trim().length > 0;
        setInvalidFields((prev) => ({ ...prev, contactNumber: !validNow }));
      } else if (name === "dateOfBirth") {
        const validNow = isAdult(value);
        setInvalidFields((prev) => ({ ...prev, dateOfBirth: !validNow }));
      } else if (name === "alternateContactNumber") {
        const validNow = value.trim().length > 0;
        setInvalidFields((prev) => ({
          ...prev,
          alternateContactNumber: !validNow,
        }));
      } else if (name === "gender") {
        const validNow = value.trim().length > 0;
        setInvalidFields((prev) => ({ ...prev, gender: !validNow }));
      } else if (name === "highestQualification") {
        const validNow = value.trim().length > 0;
        setInvalidFields((prev) => ({
          ...prev,
          highestQualification: !validNow,
        }));
      } else if (name === "previousSalary") {
        const num = value === "" ? NaN : Number(value);
        const validNow = Number.isFinite(num);
        setInvalidFields((prev) => ({ ...prev, previousSalary: !validNow }));
      } else if (name === "expectedSalary") {
        const num = value === "" ? NaN : Number(value);
        const validNow = Number.isFinite(num);
        setInvalidFields((prev) => ({ ...prev, expectedSalary: !validNow }));
      } else if (name === "notes") {
        const validNow = value.trim().length > 0;
        setInvalidFields((prev) => ({ ...prev, notes: !validNow }));
      }
    },
    [emailRegex, isAdult]
  );

  // File input change handler with proper typing
  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>, docType: string): void => {
      const file = e.target.files?.[0] || null;
      if (file) {
        setFileUploads((prev: Record<string, File | null>) => ({
          ...prev,
          [docType]: file,
        }));

        // Reset upload progress for this file
        setUploadProgress((prev: Record<string, number>) => ({
          ...prev,
          [docType]: 0,
        }));
      }
    },
    []
  );

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
    setFormData((prev) => {
      const updatedEducation = [...prev.education];
      const current = { ...updatedEducation[index] } as Education;
      if (field === "yearOfPassing") {
        const n =
          typeof value === "string" ? parseInt(value) : (value as number);
        current.yearOfPassing = Number.isFinite(n)
          ? n
          : new Date().getFullYear();
      } else if (field === "percentage") {
        const n =
          typeof value === "string" ? parseFloat(value) : (value as number);
        current.percentage = Number.isFinite(n) ? n : 0;
      } else if (field === "degree") {
        current.degree = String(value);
      } else if (field === "institution") {
        current.institution = String(value);
      } else if (field === "fieldOfStudy") {
        current.fieldOfStudy = String(value);
      } else if (field === "_id") {
        current._id = String(value);
      }
      updatedEducation[index] = current;
      return { ...prev, education: updatedEducation };
    });

    // Live clear invalid flags for this education row/field
    setInvalidFields((prev: any) => {
      const valid = (() => {
        if (
          field === "degree" ||
          field === "institution" ||
          field === "fieldOfStudy"
        )
          return String(value || "").trim().length > 0;
        if (field === "yearOfPassing")
          return Number.isFinite(
            typeof value === "string" ? parseInt(value) : (value as number)
          );
        if (field === "percentage")
          return Number.isFinite(
            typeof value === "string" ? parseFloat(value) : (value as number)
          );
        return true;
      })();
      const next = { ...prev };
      next.education = { ...(prev?.education || {}) };
      const row = { ...(next.education[index] || {}) };
      row[field as string] = !valid;
      next.education[index] = row;
      return next;
    });
  };

  const removeEducation = (index: number) => {
    const updatedEducation = formData.education.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, education: updatedEducation }));
  };

  const getSelectedDegrees = (currentIndex: number) => {
    return formData.education
      .filter((_, i) => i !== currentIndex)
      .map((edu) => edu.degree);
  };

  // Fetch candidate data if editing
  useEffect(() => {
    if (id) {
      const fetchCandidate = async () => {
        try {
          setIsLoading(true);
          const response = await api.get(`/htd/candidates/${id}`);
          const candidateData = response.data;

          // Helper to format date strings to YYYY-MM-DD
          const formatDateForInput = (
            dateString: string | Date | undefined | null
          ): string => {
            if (!dateString) return "";
            try {
              const date =
                typeof dateString === "string"
                  ? new Date(dateString)
                  : dateString;
              if (isNaN(date.getTime())) return "";
              return date.toISOString().split("T")[0];
            } catch {
              return "";
            }
          };

          // Helper function to map backend experience item to frontend shape
          const mapExperience = (
            exp: any,
            coercedType: "IT" | "NON_IT"
          ): Experience => ({
            company: exp?.company ?? exp?.companyName ?? "",
            role: exp?.role ?? "",
            startDate: formatDateForInput(exp?.startDate),
            endDate: formatDateForInput(exp?.endDate),
            description: exp?.description ?? "",
            type: coercedType,
            _id: exp?._id,
          });

          // Safely merge with initial values to prevent undefined overrides
          const formattedData: CandidateFormData = {
            ...initialFormData,
            ...Object.fromEntries(
              Object.entries(candidateData).filter(
                ([, value]) => value !== undefined && value !== null
              )
            ),
            // Ensure nested objects are properly initialized
            address: {
              ...initialFormData.address,
              ...(candidateData.address || {}),
            },
            dateOfBirth: formatDateForInput(candidateData.dateOfBirth),
            gender: (candidateData.gender ?? "").toString().toLowerCase(),
            education:
              candidateData.education?.map((edu: any) => ({
                degree: edu?.degree ?? "",
                institution: edu?.institution ?? "",
                fieldOfStudy: edu?.fieldOfStudy ?? "",
                yearOfPassing: Number.isFinite(edu?.yearOfPassing)
                  ? edu.yearOfPassing
                  : new Date().getFullYear(),
                percentage: Number.isFinite(edu?.percentage)
                  ? edu.percentage
                  : 0,
                _id: edu?._id,
              })) || [],
            // Backend stores a single `experience` array with type as "IT" | "NON-IT" and companyName
            // Split into UI-specific arrays for rendering/editing without changing submit payload structure
            itExperience:
              candidateData.experience
                ?.filter(
                  (exp: any) =>
                    (exp?.type ?? "").toString().toUpperCase() === "IT"
                )
                .map((exp: any) => mapExperience(exp, "IT")) ||
              candidateData.itExperience?.map((exp: any) => ({
                ...exp,
                startDate: formatDateForInput(exp.startDate),
                endDate: formatDateForInput(exp.endDate),
              })) ||
              [],
            nonItExperience:
              candidateData.experience
                ?.filter(
                  (exp: any) =>
                    (exp?.type ?? "").toString().toUpperCase() === "NON-IT"
                )
                .map((exp: any) => mapExperience(exp, "NON_IT")) ||
              candidateData.nonItExperience?.map((exp: any) => ({
                ...exp,
                startDate: formatDateForInput(exp.startDate),
                endDate: formatDateForInput(exp.endDate),
              })) ||
              [],
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
          // Load cities for existing state to support location auto-search in edit mode
          // Only attempt when country is India to match our location dataset
          if (formattedData.address?.state) {
            const countryLc = (
              formattedData.address.country || ""
            ).toLowerCase();
            if (countryLc === "india" || countryLc === "in") {
              try {
                await loadCitiesForState(formattedData.address.state);
              } catch (e) {
                // non-blocking
                console.warn(
                  "Failed to load cities for state",
                  formattedData.address.state,
                  e
                );
              }
            }
          }
          setError(null);
        } catch (err: unknown) {
          console.error("Error fetching candidate:", err);
          const errorMessage =
            err instanceof Error
              ? `Failed to load candidate data: ${err.message}`
              : "Failed to load candidate data. Please try again.";
          setError(errorMessage);
          setErrorList([errorMessage]);
          // Toast for fetch error
          toast.error(errorMessage);
        } finally {
          setIsLoading(false);
        }
      };

      fetchCandidate();
    }
  }, [id]);

  const validateForm = (): string | null => {
    if (!formData.name?.trim()) return "Name is required";
    if (!formData.email?.trim()) return "Email is required";
    if (!formData.contactNumber?.trim()) return "Contact number is required";
    if (!formData.dateOfBirth) return "Date of birth is required";

    // Enforce 18+ age restriction
    const dob = new Date(formData.dateOfBirth);
    if (!Number.isNaN(dob.getTime())) {
      const today = new Date();
      let age = today.getFullYear() - dob.getFullYear();
      const m = today.getMonth() - dob.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < dob.getDate())) {
        age--;
      }
      if (age < 18) return "Candidate must be at least 18 years old";
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return "Please enter a valid email address";
    }

    return null;
  };

  // Document upload handler with proper typing
  const handleDocumentUploads = useCallback(
    async (candidateId: string): Promise<void> => {
      const uploadTasks = Object.entries(fileUploads)
        .filter(([_, file]) => file !== null)
        .map(async ([docType, file]) => {
          if (!file) return;

          const formData = new FormData();
          formData.append("file", file);
          formData.append("documentType", docType);

          try {
            await api.post(`/candidates/${candidateId}/documents`, formData, {
              onUploadProgress: (progressEvent: AxiosProgressEvent) => {
                const percentCompleted = Math.round(
                  (progressEvent.loaded * 100) / (progressEvent.total || 1)
                );
                setUploadProgress((prev: Record<string, number>) => ({
                  ...prev,
                  [docType]: percentCompleted,
                }));
              },
            });
          } catch (error) {
            console.error(`Error uploading ${docType}:`, error);
            // Toast for individual document upload error
            const msg =
              error instanceof Error ? error.message : "Unknown error";
            toast.error(`Failed to upload ${docType}: ${msg}`);
            throw error;
          }
        });

      await Promise.all(uploadTasks);
    },
    [fileUploads]
  );

  const getErrorMessage = (err: any): string => {
    if (err?.response?.data?.message) return err.response.data.message;

    if (Array.isArray(err?.response?.data?.errors)) {
      const errorMessages = err.response.data.errors
        .map((er: any) => er.msg)
        .filter(Boolean)
        .join(", ");

      if (errorMessages) {
        return `Failed to save candidate: ${errorMessages}`;
      }
    }

    if (err?.message) return err.message;

    return "An unexpected error occurred. Please try again.";
  };
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      setErrorList([validationError]);
      // Compute and mark invalid fields for red borders
      setInvalidFields(computeInvalidFields(formData));
      // Toast for submit validation error
      toast.error(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(null);
    setErrorList([]);
    setInvalidFields({});

    try {
      let savedCandidate;
      if (id) {
        // Update existing candidate
        const response = await api.put(`/htd/candidates/${id}`, formData);
        savedCandidate = response.data;
      } else {
        // Create new candidate
        const response = await api.post("/htd/candidates", formData);
        savedCandidate = response.data;
      }

      // Upload documents if there are any
      const hadFiles = Object.values(fileUploads).some((file) => file);
      if (hadFiles) {
        await handleDocumentUploads(savedCandidate._id);
        // Toast for document upload success
        toast.success("All documents uploaded successfully.");
      }

      setSuccess(`Candidate ${id ? "updated" : "created"} successfully!`);
      // Toast for save success
      toast.success(`Candidate ${id ? "updated" : "created"} successfully!`);

      // Redirect after a short delay
      setTimeout(() => navigate("/htd/candidates"), 1500);
    } catch (err: any) {
      console.error("Failed to save candidate:", err);
      const errorMessage = getErrorMessage(err);
      setError(errorMessage);
      setErrorList([errorMessage]);
      // Toast for save error
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
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

    // Live clear invalid flags for this experience row/field
    setInvalidFields((prev: any) => {
      const valid =
        field === "company" || field === "role" || field === "startDate"
          ? String(value || "").trim().length > 0
          : true;
      const key = type === "IT" ? "itExperience" : "nonItExperience";
      const next = { ...prev };
      next[key] = { ...(prev?.[key] || {}) };
      const row = { ...(next[key][index] || {}) };
      row[field as string] = !valid;
      next[key][index] = row;
      return next;
    });
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

    // Live clear invalid flags for this career gap row/field
    setInvalidFields((prev: any) => {
      const valid =
        field === "startDate" || field === "endDate" || field === "reason"
          ? String(value || "").trim().length > 0
          : true;
      const next = { ...prev };
      next.careerGaps = { ...(prev?.careerGaps || {}) };
      const row = { ...(next.careerGaps[index] || {}) };
      row[field as string] = !valid;
      next.careerGaps[index] = row;
      return next;
    });
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
          proficiency: "BEGINNER",
          acquiredDuring: "BEFORE_TRAINING",
        },
      ],
    }));
  };

  const updateSkill = (index: number, field: keyof Skill, value: string) => {
    const updatedSkills = [...formData.skills];
    updatedSkills[index] = {
      ...updatedSkills[index],
      [field]: value,
    };
    setFormData((prev) => ({ ...prev, skills: updatedSkills }));

    // Live clear invalid flags for this skill row/field
    setInvalidFields((prev: any) => {
      const valid =
        field === "name" ? String(value || "").trim().length > 0 : true;
      const next = { ...prev };
      next.skills = { ...(prev?.skills || {}) };
      const row = { ...(next.skills[index] || {}) };
      row[field as string] = !valid;
      next.skills[index] = row;
      return next;
    });
  };

  const removeSkill = (index: number) => {
    const updatedSkills = formData.skills.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, skills: updatedSkills }));
  };

  if (isLoading && id) {
    return (
      <div className="p-6 flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p className="ml-3 text-gray-600">Loading candidate data...</p>
      </div>
    );
  }

  return (
    <motion.div
      className="p-4 md:p-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
    >
      <motion.div
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <motion.h1
          className="text-xl md:text-2xl font-semibold text-gray-800"
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          {id ? "Edit Candidate" : "Add New Candidate"}
        </motion.h1>
        <motion.p
          className="text-gray-600 mt-1 text-sm md:text-base"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          {id
            ? "Update candidate information"
            : "Create a new candidate profile"}
        </motion.p>
      </motion.div>

      {(errorList.length > 0 || error) && (
        <motion.div
          className="bg-red-50 border border-red-400 text-red-700 p-4 mb-6 rounded"
          initial={{ opacity: 0, x: -20, scale: 0.95 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -20, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          role="alert"
          aria-live="assertive"
        >
          <div className="font-semibold mb-1">Please fix the following:</div>
          <ul className="list-disc list-inside space-y-1">
            {(errorList.length > 0 ? errorList : [error as string]).map(
              (msg, idx) => (
                <li key={idx} className="text-sm">
                  {msg}
                </li>
              )
            )}
          </ul>
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
          className="border-b border-gray-200 overflow-x-auto"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.6 }}
        >
          <nav className="-mb-px flex min-w-max">
            <motion.button
              onClick={() => setActiveTab("personal")}
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
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
              Personal
            </motion.button>
            <motion.button
              onClick={() => setActiveTab("education")}
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
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
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
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
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
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
              className={`py-4 px-4 md:px-6 text-center border-b-2 font-medium text-sm transition-all duration-200 ${
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
          className="p-4 md:p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 1.2 }}
        >
          <AnimatePresence mode="wait">
            {activeTab === "personal" && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
              >
                <div className="space-y-6 md:space-y-8">
                  {/* Basic Information Section */}
                  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 md:p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-blue-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                      Basic Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
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
                          aria-invalid={invalidFields.name ? "true" : "false"}
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                            invalidFields.name
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
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
                          aria-invalid={invalidFields.email ? "true" : "false"}
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 transition-all duration-200 ${
                            invalidFields.email
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                          whileFocus={{
                            scale: 1.02,
                            boxShadow: "0 0 0 3px rgba(59, 130, 246, 0.1)",
                          }}
                        />
                      </motion.div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mt-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone Number *
                        </label>
                        <input
                          type="tel"
                          name="contactNumber"
                          value={formData.contactNumber}
                          onChange={handleChange}
                          required
                          aria-invalid={
                            invalidFields.contactNumber ? "true" : "false"
                          }
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                            invalidFields.contactNumber
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Alternate Phone Number
                        </label>
                        <input
                          type="tel"
                          name="alternateContactNumber"
                          value={formData.alternateContactNumber || ""}
                          onChange={handleChange}
                          aria-invalid={
                            invalidFields.alternateContactNumber
                              ? "true"
                              : "false"
                          }
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                            invalidFields.alternateContactNumber
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
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
                          min={dobMin}
                          max={dobMax}
                          aria-invalid={
                            invalidFields.dateOfBirth ? "true" : "false"
                          }
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                            invalidFields.dateOfBirth
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Gender
                        </label>
                        <select
                          name="gender"
                          value={formData.gender}
                          onChange={handleChange}
                          aria-invalid={invalidFields.gender ? "true" : "false"}
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                            invalidFields.gender
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                        >
                          <option value="">Select Gender</option>
                          <option value="male">Male</option>
                          <option value="female">Female</option>
                          <option value="other">Other</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Address Section */}
                  <div className="bg-green-50 border-l-4 border-green-400 p-4 md:p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-green-800 mb-4">
                      Address
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Street
                        </label>
                        <input
                          type="text"
                          name="address.street"
                          value={formData.address.street}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          State
                        </label>
                        <input
                          type="text"
                          name="address.state"
                          value={formData.address.state}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          City
                        </label>
                        <input
                          type="text"
                          name="address.city"
                          value={formData.address.city}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Pincode
                        </label>
                        <input
                          type="text"
                          name="address.pincode"
                          value={formData.address.pincode}
                          onChange={handleChange}
                          className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Professional Information Section */}
                  <div className="bg-orange-50 border-l-4 border-orange-400 p-4 md:p-6 rounded-lg">
                    <h4 className="text-lg font-semibold text-orange-800 mb-4 flex items-center">
                      <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
                      Professional Information
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
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
                          <option value="HIRED">Hired</option>
                          <option value="IN_TRAINING">In Training</option>
                          <option value="DEPLOYED">Deployed</option>
                          <option value="INACTIVE">Inactive</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Highest Qualification *
                        </label>
                        <select
                          name="highestQualification"
                          value={formData.highestQualification}
                          onChange={handleChange}
                          required
                          aria-invalid={
                            invalidFields.highestQualification
                              ? "true"
                              : "false"
                          }
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                            invalidFields.highestQualification
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
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
                          Previous Salary (₹){" "}
                          <span className="text-gray-400 text-xs">
                            (in LPA)
                          </span>
                        </label>
                        <input
                          type="number"
                          name="previousSalary"
                          value={formData.previousSalary}
                          onChange={handleChange}
                          aria-invalid={
                            invalidFields.previousSalary ? "true" : "false"
                          }
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                            invalidFields.previousSalary
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                      <div className="md:col-span-2 lg:col-span-1">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Expected Salary (₹){" "}
                          <span className="text-gray-400 text-xs">
                            (in LPA)
                          </span>
                        </label>
                        <input
                          type="number"
                          name="expectedSalary"
                          value={formData.expectedSalary}
                          onChange={handleChange}
                          aria-invalid={
                            invalidFields.expectedSalary ? "true" : "false"
                          }
                          className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                            invalidFields.expectedSalary
                              ? "border-red-500 focus:ring-red-500"
                              : "border-gray-300 focus:ring-blue-500"
                          }`}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Additional Notes Section */}
                  <div className="bg-gray-50 border-l-4 border-gray-400 p-4 md:p-6 rounded-lg">
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
                        aria-invalid={invalidFields.notes ? "true" : "false"}
                        className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                          invalidFields.notes
                            ? "border-red-500 focus:ring-red-500"
                            : "border-gray-300 focus:ring-blue-500"
                        }`}
                        placeholder="Additional notes about the candidate..."
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "education" && (
              <motion.div
                key="education"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
              >
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
                          className="bg-gray-50 p-4 rounded-md relative mb-4"
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
                                  updateEducation(
                                    index,
                                    "degree",
                                    e.target.value
                                  )
                                }
                                required
                                aria-invalid={Boolean(
                                  invalidFields.education?.[index]?.degree
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.education?.[index]?.degree
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
                              >
                                <option value="">
                                  Select Degree/Certificate
                                </option>
                                <optgroup label="School Education">
                                  <option
                                    value="10th/SSC/SSLC"
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("10th/SSC/SSLC")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("12th/HSC/Intermediate")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("B.Tech/B.E.")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("B.Sc")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("B.Com")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("B.A")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("BBA")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("BCA")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("M.Tech/M.E.")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("M.Sc")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("M.Com")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("M.A")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("MBA")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("MCA")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("Ph.D")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("Diploma")}
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
                                    {getSelectedDegrees(index).includes(
                                      "Diploma"
                                    )
                                      ? "(Already Added)"
                                      : ""}
                                  </option>
                                  <option
                                    value="Advanced Diploma"
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("Advanced Diploma")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("Professional Certificate")}
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
                                    disabled={getSelectedDegrees(
                                      index
                                    ).includes("Industry Certification")}
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
                                aria-invalid={Boolean(
                                  invalidFields.education?.[index]?.institution
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.education?.[index]?.institution
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                aria-invalid={Boolean(
                                  invalidFields.education?.[index]?.fieldOfStudy
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.education?.[index]?.fieldOfStudy
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                  <option value="Mathematics">
                                    Mathematics
                                  </option>
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
                                aria-invalid={Boolean(
                                  invalidFields.education?.[index]
                                    ?.yearOfPassing
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.education?.[index]
                                    ?.yearOfPassing
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                aria-invalid={Boolean(
                                  invalidFields.education?.[index]?.percentage
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.education?.[index]?.percentage
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
                              />
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "experience" && (
              <motion.div
                key="experience"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
              >
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
                                aria-invalid={Boolean(
                                  invalidFields.itExperience?.[index]?.company
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.itExperience?.[index]?.company
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                aria-invalid={Boolean(
                                  invalidFields.itExperience?.[index]?.role
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.itExperience?.[index]?.role
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                aria-invalid={Boolean(
                                  invalidFields.itExperience?.[index]?.startDate
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.itExperience?.[index]?.startDate
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                        No Non-IT experience added. Click "Add Non-IT
                        Experience" to add details.
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
                                aria-invalid={Boolean(
                                  invalidFields.nonItExperience?.[index]
                                    ?.company
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.nonItExperience?.[index]
                                    ?.company
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                aria-invalid={Boolean(
                                  invalidFields.nonItExperience?.[index]?.role
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.nonItExperience?.[index]?.role
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                aria-invalid={Boolean(
                                  invalidFields.nonItExperience?.[index]
                                    ?.startDate
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.nonItExperience?.[index]
                                    ?.startDate
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                        No career gaps added. Click "Add Career Gap" to add
                        details.
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
                                aria-invalid={Boolean(
                                  invalidFields.careerGaps?.[index]?.startDate
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.careerGaps?.[index]?.startDate
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                  updateCareerGap(
                                    index,
                                    "endDate",
                                    e.target.value
                                  )
                                }
                                required
                                aria-invalid={Boolean(
                                  invalidFields.careerGaps?.[index]?.endDate
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.careerGaps?.[index]?.endDate
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                              aria-invalid={Boolean(
                                invalidFields.careerGaps?.[index]?.reason
                              )}
                              rows={2}
                              className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                invalidFields.careerGaps?.[index]?.reason
                                  ? "border-red-500 focus:ring-red-500"
                                  : "border-gray-300 focus:ring-blue-500"
                              }`}
                            />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "skills" && (
              <motion.div
                key="skills"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
              >
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
                                aria-invalid={Boolean(
                                  invalidFields.skills?.[index]?.name
                                )}
                                className={`w-full border rounded-md py-2 px-3 focus:outline-none focus:ring-2 ${
                                  invalidFields.skills?.[index]?.name
                                    ? "border-red-500 focus:ring-red-500"
                                    : "border-gray-300 focus:ring-blue-500"
                                }`}
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
                                  <option value="INTERMEDIATE">
                                    Intermediate
                                  </option>
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
              </motion.div>
            )}

            {activeTab === "documents" && (
              <motion.div
                key="documents"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.4 }}
              >
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
                    {(uploadProgress["RESUME"] || 0) > 0 && (
                      <div className="mt-2">
                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                          <div
                            className="bg-blue-600 h-2.5 rounded-full"
                            style={{
                              width: `${uploadProgress["RESUME"] || 0}%`,
                            }}
                          ></div>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                          {uploadProgress["RESUME"] || 0}% uploaded
                        </p>
                      </div>
                    )}

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Offer Letter
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "OFFER_LETTER")}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadProgress["OFFER_LETTER"] > 0 && (
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

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Relieving Letter
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) =>
                          handleFileChange(e, "RELIEVING_LETTER")
                        }
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadProgress["RELIEVING_LETTER"] > 0 && (
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

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        ID Proof
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "ID_PROOF")}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadProgress["ID_PROOF"] > 0 && (
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-600 h-2.5 rounded-full"
                              style={{
                                width: `${uploadProgress["ID_PROOF"]}%`,
                              }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">
                            {uploadProgress["ID_PROOF"]}% uploaded
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
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
                        {uploadProgress["AADHAR"] > 0 && (
                          <div className="mt-2">
                            <div className="bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full"
                                style={{
                                  width: `${uploadProgress["AADHAR"]}%`,
                                }}
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
                        {uploadProgress["PAN"] > 0 && (
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

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Bank Statement
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "BANK_STATEMENT")}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadProgress["BANK_STATEMENT"] > 0 && (
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

                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Other Document
                      </label>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileChange(e, "OTHER")}
                        className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                      />
                      {uploadProgress["OTHER"] > 0 && (
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
                    {id &&
                      formData.documents &&
                      formData.documents.length > 0 && (
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
                                    {doc?.name || "Document"}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    {doc?.type || ""}
                                  </p>
                                </div>
                                <div className="flex space-x-2">
                                  <a
                                    href={doc?.url || "#"}
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="mt-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            {/* Left-side Back button for step-back functionality */}
            <div className="flex-1">
              <button
                type="button"
                onClick={goToPrevTab}
                disabled={isFirstTab}
                className={`py-2 px-4 rounded-md w-full sm:w-auto border transition ${
                  isFirstTab
                    ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                    : "bg-white text-gray-700 hover:bg-gray-50 border-gray-300"
                }`}
              >
                Back
              </button>
            </div>

            {/* Right-side controls: Next on intermediate tabs; Cancel + Submit only on last tab */}
            <div className="flex flex-col-reverse sm:flex-row gap-3 justify-end">
              {!isLastTab ? (
                <button
                  type="button"
                  onClick={handleNextClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 ease-in-out w-full sm:w-auto"
                >
                  Next
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => navigate("/htd/candidates")}
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 py-2 px-4 rounded-md transition duration-300 ease-in-out w-full sm:w-auto"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md transition duration-300 ease-in-out flex items-center w-full sm:w-auto ${
                      isLoading ? "opacity-70 cursor-not-allowed" : ""
                    }`}
                  >
                    {isLoading && (
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
                </>
              )}
            </div>
          </div>
        </motion.form>
      </motion.div>
    </motion.div>
  );
};

export default CandidateForm;
