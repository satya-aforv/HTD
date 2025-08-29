import baseAPI from './baseAPI';

export interface ScheduledReport {
  _id: string;
  name: string;
  description: string;
  template: {
    _id: string;
    name: string;
    type: string;
  };
  schedule: {
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: {
      hour: number;
      minute: number;
    };
    timezone: string;
  };
  recipients: Array<{
    user: {
      _id: string;
      name: string;
      email: string;
    };
    email: string;
    deliveryMethod: string;
  }>;
  format: string;
  isActive: boolean;
  lastRun?: string;
  nextRun: string;
  runCount: number;
  failureCount: number;
  createdAt: string;
}

export interface CreateScheduledReportData {
  name: string;
  description?: string;
  templateId: string;
  schedule: {
    frequency: string;
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: {
      hour: number;
      minute: number;
    };
    timezone?: string;
  };
  recipients: Array<{
    user: string;
    email: string;
    deliveryMethod: string;
  }>;
  format: string;
  parameters?: Record<string, unknown>;
  retentionDays?: number;
}

export interface ScheduledReportsResponse {
  reports: ScheduledReport[];
  totalPages: number;
  currentPage: number;
  totalReports: number;
}

export interface ScheduleOptions {
  frequencies: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  daysOfWeek: Array<{
    value: number;
    label: string;
  }>;
  deliveryMethods: Array<{
    value: string;
    label: string;
    description: string;
  }>;
  formats: Array<{
    value: string;
    label: string;
    description: string;
  }>;
}

class ScheduledReportsAPI {
  // Get scheduled reports with pagination and filters
  async getScheduledReports(params?: {
    page?: number;
    limit?: number;
    isActive?: boolean;
  }): Promise<ScheduledReportsResponse> {
    const queryParams = new URLSearchParams();
    
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());

    const response = await baseAPI.get(`/scheduled-reports?${queryParams}`);
    return response.data;
  }

  // Get scheduled report by ID
  async getScheduledReportById(reportId: string): Promise<ScheduledReport> {
    const response = await baseAPI.get(`/scheduled-reports/${reportId}`);
    return response.data;
  }

  // Create new scheduled report
  async createScheduledReport(data: CreateScheduledReportData): Promise<ScheduledReport> {
    const response = await baseAPI.post('/scheduled-reports', data);
    return response.data;
  }

  // Update scheduled report
  async updateScheduledReport(reportId: string, data: Partial<CreateScheduledReportData>): Promise<ScheduledReport> {
    const response = await baseAPI.put(`/scheduled-reports/${reportId}`, data);
    return response.data;
  }

  // Delete scheduled report
  async deleteScheduledReport(reportId: string): Promise<void> {
    await baseAPI.delete(`/scheduled-reports/${reportId}`);
  }

  // Toggle scheduled report active status
  async toggleScheduledReport(reportId: string): Promise<{
    isActive: boolean;
    nextRun: string;
  }> {
    const response = await baseAPI.post(`/scheduled-reports/${reportId}/toggle`);
    return response.data;
  }

  // Run scheduled report immediately
  async runScheduledReportNow(reportId: string): Promise<void> {
    await baseAPI.post(`/scheduled-reports/${reportId}/run`);
  }

  // Get schedule configuration options
  async getScheduleOptions(): Promise<ScheduleOptions> {
    const response = await baseAPI.get('/scheduled-reports/options');
    return response.data;
  }

  // Get scheduler status (admin only)
  async getSchedulerStatus(): Promise<{
    scheduler: {
      isRunning: boolean;
      intervalId: string | null;
      uptime: number;
    };
    statistics: {
      totalScheduled: number;
      activeScheduled: number;
      dueReports: number;
    };
  }> {
    const response = await baseAPI.get('/scheduled-reports/scheduler/status');
    return response.data;
  }

  // Start scheduler (admin only)
  async startScheduler(intervalMinutes?: number): Promise<void> {
    await baseAPI.post('/scheduled-reports/scheduler/start', { intervalMinutes });
  }

  // Stop scheduler (admin only)
  async stopScheduler(): Promise<void> {
    await baseAPI.post('/scheduled-reports/scheduler/stop');
  }
}

export const scheduledReportsAPI = new ScheduledReportsAPI();
