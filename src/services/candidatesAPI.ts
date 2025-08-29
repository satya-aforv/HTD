// src/services/candidatesAPI.ts
import api from './baseAPI';

export interface CandidateFilters {
  page?: number;
  limit?: number;
  status?: string;
  skill?: string;
  experience?: string;
  hasGaps?: boolean;
  search?: string;
}

export interface CandidateData {
  name: string;
  email: string;
  contactNumber: string;
  alternateContactNumber?: string;
  dateOfBirth: string;
  gender: 'MALE' | 'FEMALE' | 'OTHER';
  address: {
    street: string;
    city: string;
    state: string;
    pincode: string;
    country?: string;
  };
  candidateId?: string;
  user?: string;
}

export interface EducationData {
  degree: string;
  institution: string;
  yearOfPassing: number;
  percentage: number;
  certificateUrl?: string;
}

export interface ExperienceData {
  type: 'IT' | 'NON-IT';
  companyName: string;
  role: string;
  startDate: string;
  endDate: string;
  salary: number;
  documentUrl?: string;
}

export interface CareerGapData {
  startDate: string;
  endDate: string;
  reason: string;
}

export interface SkillData {
  name: string;
  type: 'IT' | 'NON-IT';
  proficiency: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED' | 'EXPERT';
  acquiredDuring: 'BEFORE_TRAINING' | 'DURING_TRAINING';
}

export const candidatesAPI = {
  getCandidates: async (params?: CandidateFilters) => {
    try {
      console.log('Fetching candidates with params:', params);
      const response = await api.get('/htd/candidates', { params });
      console.log('Candidates API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching candidates:', error);
      throw error;
    }
  },

  getCandidate: async (id: string) => {
    try {
      console.log('Fetching candidate with ID:', id);
      const response = await api.get(`/htd/candidates/${id}`);
      console.log('Candidate API response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching candidate:', error);
      throw error;
    }
  },

  createCandidate: async (data: CandidateData) => {
    try {
      console.log('Creating candidate with data:', data);
      const response = await api.post('/htd/candidates', data);
      console.log('Create candidate response:', response.data);
      return response;
    } catch (error) {
      console.error('Error creating candidate:', error);
      throw error;
    }
  },

  updateCandidate: async (id: string, data: Partial<CandidateData>) => {
    try {
      console.log('Updating candidate:', id, 'with data:', data);
      const response = await api.put(`/htd/candidates/${id}`, data);
      console.log('Update candidate response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating candidate:', error);
      throw error;
    }
  },

  deleteCandidate: async (id: string) => {
    try {
      console.log('Deleting candidate with ID:', id);
      const response = await api.delete(`/htd/candidates/${id}`);
      console.log('Delete candidate response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting candidate:', error);
      throw error;
    }
  },

  // Document management
  uploadDocument: async (id: string, formData: FormData) => {
    try {
      console.log('Uploading document for candidate:', id);
      const response = await api.post(`/htd/candidates/${id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      console.log('Upload document response:', response.data);
      return response;
    } catch (error) {
      console.error('Error uploading document:', error);
      throw error;
    }
  },

  getDocuments: async (id: string) => {
    try {
      console.log('Fetching documents for candidate:', id);
      const response = await api.get(`/htd/candidates/${id}/documents`);
      console.log('Get documents response:', response.data);
      return response;
    } catch (error) {
      console.error('Error fetching documents:', error);
      throw error;
    }
  },

  // Education management
  addEducation: async (id: string, data: EducationData) => {
    try {
      console.log('Adding education for candidate:', id, 'with data:', data);
      const response = await api.post(`/htd/candidates/${id}/education`, data);
      console.log('Add education response:', response.data);
      return response;
    } catch (error) {
      console.error('Error adding education:', error);
      throw error;
    }
  },

  updateEducation: async (id: string, educationId: string, data: Partial<EducationData>) => {
    try {
      console.log('Updating education:', educationId, 'for candidate:', id);
      const response = await api.put(`/htd/candidates/${id}/education/${educationId}`, data);
      console.log('Update education response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating education:', error);
      throw error;
    }
  },

  deleteEducation: async (id: string, educationId: string) => {
    try {
      console.log('Deleting education:', educationId, 'for candidate:', id);
      const response = await api.delete(`/htd/candidates/${id}/education/${educationId}`);
      console.log('Delete education response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting education:', error);
      throw error;
    }
  },

  // Experience management
  addExperience: async (id: string, data: ExperienceData) => {
    try {
      console.log('Adding experience for candidate:', id, 'with data:', data);
      const response = await api.post(`/htd/candidates/${id}/experience`, data);
      console.log('Add experience response:', response.data);
      return response;
    } catch (error) {
      console.error('Error adding experience:', error);
      throw error;
    }
  },

  updateExperience: async (id: string, experienceId: string, data: Partial<ExperienceData>) => {
    try {
      console.log('Updating experience:', experienceId, 'for candidate:', id);
      const response = await api.put(`/htd/candidates/${id}/experience/${experienceId}`, data);
      console.log('Update experience response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating experience:', error);
      throw error;
    }
  },

  deleteExperience: async (id: string, experienceId: string) => {
    try {
      console.log('Deleting experience:', experienceId, 'for candidate:', id);
      const response = await api.delete(`/htd/candidates/${id}/experience/${experienceId}`);
      console.log('Delete experience response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting experience:', error);
      throw error;
    }
  },

  // Career gaps management
  addCareerGap: async (id: string, data: CareerGapData) => {
    try {
      console.log('Adding career gap for candidate:', id, 'with data:', data);
      const response = await api.post(`/htd/candidates/${id}/career-gaps`, data);
      console.log('Add career gap response:', response.data);
      return response;
    } catch (error) {
      console.error('Error adding career gap:', error);
      throw error;
    }
  },

  updateCareerGap: async (id: string, gapId: string, data: Partial<CareerGapData>) => {
    try {
      console.log('Updating career gap:', gapId, 'for candidate:', id);
      const response = await api.put(`/htd/candidates/${id}/career-gaps/${gapId}`, data);
      console.log('Update career gap response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating career gap:', error);
      throw error;
    }
  },

  deleteCareerGap: async (id: string, gapId: string) => {
    try {
      console.log('Deleting career gap:', gapId, 'for candidate:', id);
      const response = await api.delete(`/htd/candidates/${id}/career-gaps/${gapId}`);
      console.log('Delete career gap response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting career gap:', error);
      throw error;
    }
  },

  // Skills management
  addSkill: async (id: string, data: SkillData) => {
    try {
      console.log('Adding skill for candidate:', id, 'with data:', data);
      const response = await api.post(`/htd/candidates/${id}/skills`, data);
      console.log('Add skill response:', response.data);
      return response;
    } catch (error) {
      console.error('Error adding skill:', error);
      throw error;
    }
  },

  updateSkill: async (id: string, skillId: string, data: Partial<SkillData>) => {
    try {
      console.log('Updating skill:', skillId, 'for candidate:', id);
      const response = await api.put(`/htd/candidates/${id}/skills/${skillId}`, data);
      console.log('Update skill response:', response.data);
      return response;
    } catch (error) {
      console.error('Error updating skill:', error);
      throw error;
    }
  },

  deleteSkill: async (id: string, skillId: string) => {
    try {
      console.log('Deleting skill:', skillId, 'for candidate:', id);
      const response = await api.delete(`/htd/candidates/${id}/skills/${skillId}`);
      console.log('Delete skill response:', response.data);
      return response;
    } catch (error) {
      console.error('Error deleting skill:', error);
      throw error;
    }
  },

  // Generate client profile
  generateClientProfile: async (id: string) => {
    try {
      console.log('Generating client profile for candidate:', id);
      const response = await api.get(`/htd/candidates/${id}/client-profile`);
      console.log('Generate client profile response:', response.data);
      return response;
    } catch (error) {
      console.error('Error generating client profile:', error);
      throw error;
    }
  },
};
