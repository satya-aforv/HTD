import { baseAPI } from './baseAPI';

export interface CandidateDashboardData {
  personalInfo: {
    name: string;
    email: string;
    candidateId: string;
    status: string;
    contactNumber: string;
    dateOfBirth: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
      country: string;
    };
  };
  progressMetrics: {
    trainingCompletion: number;
    skillsAcquired: number;
    averagePerformance: number;
    activeTrainings: number;
    overallProgress: number;
  };
  experience: {
    summary: {
      totalIT: string;
      totalNonIT: string;
      totalOverall: string;
    };
    details: any[];
  };
  currentTraining: any;
  completedTrainings: number;
  totalTrainings: number;
  skills: {
    beforeTraining: any[];
    duringTraining: any[];
    total: number;
  };
  payments: {
    summary: any;
    recent: any[];
    totalReceived: number;
  };
  notifications: {
    unread: number;
    total: number;
  };
}

export interface TrainingProgress {
  trainingId: string;
  startDate: string;
  expectedEndDate: string;
  actualEndDate?: string;
  status: string;
  duration: number;
  modules: Array<{
    name: string;
    technology: string;
    duration: number;
    status: string;
    trainer: string;
  }>;
  evaluations: Array<{
    month: number;
    year: number;
    rating: number;
    comments: string;
    evaluatedBy: string;
    evaluatedAt: string;
  }>;
  skillsAcquired: any[];
  averageRating: number;
  completionPercentage: number;
}

export interface PaymentHistory {
  payments: any[];
  summary: any;
  monthlyBreakdown: any[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface SkillDevelopment {
  timeline: Array<{
    name: string;
    type?: string;
    proficiency: string;
    acquiredDuring: string;
    acquiredDate?: string;
    source: string;
    trainingId?: string;
  }>;
  statistics: {
    total: number;
    beforeTraining: number;
    duringTraining: number;
    byType: {
      IT: number;
      'NON-IT': number;
    };
    byProficiency: {
      BEGINNER: number;
      INTERMEDIATE: number;
      ADVANCED: number;
      EXPERT: number;
    };
  };
  currentSkills: any[];
}

class CandidatePortalAPI {
  // Get candidate dashboard data
  async getDashboard(): Promise<CandidateDashboardData> {
    const response = await baseAPI.get('/api/candidate-portal/dashboard');
    return response.data;
  }

  // Get training progress
  async getTrainingProgress(): Promise<{
    trainings: TrainingProgress[];
    summary: {
      total: number;
      completed: number;
      inProgress: number;
      planned: number;
    };
  }> {
    const response = await baseAPI.get('/api/candidate-portal/training-progress');
    return response.data;
  }

  // Get payment history
  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
    year?: number;
    type?: string;
  }): Promise<PaymentHistory> {
    const response = await baseAPI.get('/api/candidate-portal/payment-history', { params });
    return response.data;
  }

  // Get skill development timeline
  async getSkillDevelopment(): Promise<SkillDevelopment> {
    const response = await baseAPI.get('/api/candidate-portal/skill-development');
    return response.data;
  }

  // Update personal information
  async updatePersonalInfo(data: {
    contactNumber?: string;
    alternateContactNumber?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      pincode?: string;
    };
  }): Promise<any> {
    const response = await baseAPI.put('/api/candidate-portal/personal-info', data);
    return response.data;
  }

  // Get documents
  async getDocuments(): Promise<{
    documents: Array<{
      type: string;
      uploadedAt: string;
      description: string;
      hasDocument: boolean;
    }>;
    summary: {
      total: number;
      byType: Record<string, number>;
    };
  }> {
    const response = await baseAPI.get('/api/candidate-portal/documents');
    return response.data;
  }
}

export const candidatePortalAPI = new CandidatePortalAPI();
