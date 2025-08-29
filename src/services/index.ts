// src/services/index.ts
// Central export file for all API services

export { authAPI } from "./authAPI";
export { candidatesAPI } from "./candidatesAPI";
export { usersAPI } from "./usersAPI";
export { hospitalsAPI } from "./hospitalsAPI";
export { statesAPI } from "./statesAPI";
export { permissionsAPI } from "./permissionsAPI";
export { doctorsAPI } from "./doctorsAPI";
export { htdAPI } from "./htdAPI";
export { handleApiError, checkApiHealth } from "./baseAPI";

// Export types
export type {
  LoginData,
  RegisterData,
  ForgotPasswordData,
  ResetPasswordData,
  ChangePasswordData,
} from "./authAPI";
export type {
  CandidateFilters,
  CandidateData,
  EducationData,
  ExperienceData,
  CareerGapData,
  SkillData,
} from "./candidatesAPI";
export type { UserFilters, UserData } from "./usersAPI";
export type {
  HospitalFilters,
  HospitalData,
  HospitalContactData,
} from "./hospitalsAPI";
export type { StateFilters, StateData } from "./statesAPI";
export type { PermissionData } from "./permissionsAPI";
export type { DoctorFilters, DoctorData } from "./doctorsAPI";

export type {
  DashboardStats,
  Candidate as HTDCandidate,
  Training as HTDTraining,
  Payment as HTDPayment,
} from "./htdAPI";
