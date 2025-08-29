import axios from './baseAPI';

export interface PaymentFormData {
  _id?: string;
  candidateId: string;
  amount: number;
  type: string;
  paymentDate: string;
  paymentMode: string;
  transactionId: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  description: string;
  status: string;
  proofUrl?: string;
  processor?: string;
  relatedTraining?: string;
  month: string;
  year: number;
}

export interface Payment {
  _id: string;
  candidateId: {
    _id: string;
    name: string;
    email: string;
    phone: string;
    photo: string;
  };
  amount: number;
  type: string;
  paymentDate: string;
  paymentMode: string;
  transactionId: string;
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    ifscCode: string;
  };
  description: string;
  status: string;
  proofUrl?: string;
  processor?: string;
  relatedTraining?: {
    _id: string;
    description: string;
  };
  month: string;
  year: number;
  createdAt: string;
  updatedAt: string;
}

export const paymentAPI = {
  getPayment: async (id: string): Promise<Payment> => {
    const response = await axios.get(`/htd/payments/${id}`);
    return response.data;
  },

  generateReceipt: async (id: string): Promise<Blob> => {
    const response = await axios.get(`/htd/payments/${id}/receipt`, {
      responseType: 'blob',
    });
    return response.data;
  },

  createPayment: async (data: PaymentFormData): Promise<Payment> => {
    const response = await axios.post('/htd/payments', data);
    return response.data;
  },

  updatePayment: async (id: string, data: PaymentFormData): Promise<Payment> => {
    const response = await axios.put(`/htd/payments/${id}`, data);
    return response.data;
  },

  uploadProof: async (id: string, formData: FormData): Promise<{ proofUrl: string }> => {
    const response = await axios.post(`/htd/payments/${id}/proof`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};
