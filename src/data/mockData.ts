// Mock data for HTD system components
export interface MockCandidate {
  _id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  qualification?: string;
  experience?: string;
  skills?: string[];
  status: 'active' | 'inactive' | 'pending';
  joinDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockPayment {
  _id: string;
  candidateId: MockCandidate;
  amount: number;
  type: 'registration' | 'tuition' | 'certification' | 'other';
  paymentDate: string;
  paymentMode?: string;
  transactionId?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  month?: string;
  year?: number;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockTraining {
  _id: string;
  title: string;
  description: string;
  instructor: string;
  duration: number; // in hours
  startDate: string;
  endDate: string;
  capacity: number;
  enrolled: number;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  category: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  createdAt: string;
  updatedAt: string;
}

// Sample Candidates
export const mockCandidates: MockCandidate[] = [
  {
    _id: '615c76a5a5a5a5a5a5a5a5a1',
    name: 'John Smith',
    email: 'john.smith@email.com',
    phone: '+1-555-0123',
    address: '123 Main St, New York, NY 10001',
    qualification: 'Bachelor of Computer Science',
    experience: '3 years in software development',
    skills: ['JavaScript', 'React', 'Node.js', 'Python'],
    status: 'active',
    joinDate: '2024-01-15',
    createdAt: '2024-01-15T10:30:00Z',
    updatedAt: '2024-08-20T14:22:00Z'
  },
  {
    _id: '615c76a5a5a5a5a5a5a5a5a2',
    name: 'Sarah Johnson',
    email: 'sarah.johnson@email.com',
    phone: '+1-555-0124',
    address: '456 Oak Ave, Los Angeles, CA 90210',
    qualification: 'Master of Business Administration',
    experience: '5 years in project management',
    skills: ['Project Management', 'Agile', 'Scrum', 'Leadership'],
    status: 'active',
    joinDate: '2024-02-01',
    createdAt: '2024-02-01T09:15:00Z',
    updatedAt: '2024-08-25T11:45:00Z'
  },
  {
    _id: '615c76a5a5a5a5a5a5a5a5a3',
    name: 'Michael Chen',
    email: 'michael.chen@email.com',
    phone: '+1-555-0125',
    address: '789 Pine St, San Francisco, CA 94102',
    qualification: 'Bachelor of Engineering',
    experience: '2 years in data analysis',
    skills: ['Python', 'SQL', 'Data Analysis', 'Machine Learning'],
    status: 'pending',
    joinDate: '2024-08-01',
    createdAt: '2024-08-01T16:20:00Z',
    updatedAt: '2024-08-27T10:30:00Z'
  },
  {
    _id: '615c76a5a5a5a5a5a5a5a5a4',
    name: 'Emily Davis',
    email: 'emily.davis@email.com',
    phone: '+1-555-0126',
    address: '321 Elm St, Chicago, IL 60601',
    qualification: 'Bachelor of Design',
    experience: '4 years in UI/UX design',
    skills: ['Figma', 'Adobe XD', 'UI Design', 'User Research'],
    status: 'active',
    joinDate: '2024-03-10',
    createdAt: '2024-03-10T13:45:00Z',
    updatedAt: '2024-08-26T15:20:00Z'
  },
  {
    _id: '615c76a5a5a5a5a5a5a5a5a5',
    name: 'David Wilson',
    email: 'david.wilson@email.com',
    phone: '+1-555-0127',
    address: '654 Maple Dr, Austin, TX 73301',
    qualification: 'Master of Computer Science',
    experience: '6 years in DevOps',
    skills: ['Docker', 'Kubernetes', 'AWS', 'CI/CD'],
    status: 'inactive',
    joinDate: '2023-11-20',
    createdAt: '2023-11-20T08:30:00Z',
    updatedAt: '2024-07-15T12:00:00Z'
  }
];

// Sample Payments
export const mockPayments: MockPayment[] = [
  {
    _id: 'pay_001',
    candidateId: mockCandidates[0],
    amount: 2500.00,
    type: 'registration',
    paymentDate: '2024-08-15',
    paymentMode: 'Credit Card',
    transactionId: 'TXN_REG_001',
    status: 'completed',
    month: 'August',
    year: 2024,
    description: 'Registration fee for Full Stack Development Program',
    createdAt: '2024-08-15T10:30:00Z',
    updatedAt: '2024-08-15T10:30:00Z'
  },
  {
    _id: 'pay_002',
    candidateId: mockCandidates[1],
    amount: 1800.00,
    type: 'tuition',
    paymentDate: '2024-08-20',
    paymentMode: 'Bank Transfer',
    transactionId: 'TXN_TUI_002',
    status: 'completed',
    month: 'August',
    year: 2024,
    description: 'Monthly tuition fee for Project Management Course',
    createdAt: '2024-08-20T14:15:00Z',
    updatedAt: '2024-08-20T14:15:00Z'
  },
  {
    _id: 'pay_003',
    candidateId: mockCandidates[2],
    amount: 500.00,
    type: 'certification',
    paymentDate: '2024-08-25',
    paymentMode: 'PayPal',
    transactionId: 'TXN_CERT_003',
    status: 'pending',
    month: 'August',
    year: 2024,
    description: 'Certification exam fee for Data Analytics',
    createdAt: '2024-08-25T09:45:00Z',
    updatedAt: '2024-08-25T09:45:00Z'
  },
  {
    _id: 'pay_004',
    candidateId: mockCandidates[3],
    amount: 3200.00,
    type: 'registration',
    paymentDate: '2024-08-10',
    paymentMode: 'Credit Card',
    transactionId: 'TXN_REG_004',
    status: 'completed',
    month: 'August',
    year: 2024,
    description: 'Registration fee for UI/UX Design Bootcamp',
    createdAt: '2024-08-10T11:20:00Z',
    updatedAt: '2024-08-10T11:20:00Z'
  },
  {
    _id: 'pay_005',
    candidateId: mockCandidates[4],
    amount: 750.00,
    type: 'other',
    paymentDate: '2024-08-05',
    paymentMode: 'Cash',
    transactionId: 'TXN_OTH_005',
    status: 'failed',
    month: 'August',
    year: 2024,
    description: 'Workshop materials and resources fee',
    createdAt: '2024-08-05T16:30:00Z',
    updatedAt: '2024-08-05T16:35:00Z'
  },
  {
    _id: 'pay_006',
    candidateId: mockCandidates[0],
    amount: 1200.00,
    type: 'tuition',
    paymentDate: '2024-07-15',
    paymentMode: 'Bank Transfer',
    transactionId: 'TXN_TUI_006',
    status: 'refunded',
    month: 'July',
    year: 2024,
    description: 'Monthly tuition fee - refunded due to course cancellation',
    createdAt: '2024-07-15T13:10:00Z',
    updatedAt: '2024-07-20T10:15:00Z'
  }
];

// Sample Trainings
export const mockTrainings: MockTraining[] = [
  {
    _id: 'train_001',
    title: 'Full Stack Web Development',
    description: 'Comprehensive course covering frontend and backend development using modern technologies like React, Node.js, and MongoDB.',
    instructor: 'Dr. Alex Rodriguez',
    duration: 120,
    startDate: '2024-09-01',
    endDate: '2024-12-15',
    capacity: 25,
    enrolled: 18,
    status: 'upcoming',
    category: 'Web Development',
    level: 'intermediate',
    createdAt: '2024-06-15T10:00:00Z',
    updatedAt: '2024-08-20T14:30:00Z'
  },
  {
    _id: 'train_002',
    title: 'Data Science Fundamentals',
    description: 'Learn the basics of data science including Python programming, statistics, data visualization, and machine learning.',
    instructor: 'Prof. Maria Garcia',
    duration: 80,
    startDate: '2024-08-15',
    endDate: '2024-10-30',
    capacity: 20,
    enrolled: 15,
    status: 'ongoing',
    category: 'Data Science',
    level: 'beginner',
    createdAt: '2024-07-01T09:30:00Z',
    updatedAt: '2024-08-25T11:15:00Z'
  },
  {
    _id: 'train_003',
    title: 'Advanced React Development',
    description: 'Deep dive into React ecosystem including Redux, Context API, hooks, testing, and performance optimization.',
    instructor: 'John Thompson',
    duration: 60,
    startDate: '2024-07-01',
    endDate: '2024-08-15',
    capacity: 15,
    enrolled: 12,
    status: 'completed',
    category: 'Frontend Development',
    level: 'advanced',
    createdAt: '2024-05-20T14:45:00Z',
    updatedAt: '2024-08-15T16:00:00Z'
  },
  {
    _id: 'train_004',
    title: 'UI/UX Design Bootcamp',
    description: 'Complete design bootcamp covering user research, wireframing, prototyping, and design systems using Figma.',
    instructor: 'Sarah Mitchell',
    duration: 100,
    startDate: '2024-09-15',
    endDate: '2024-12-01',
    capacity: 20,
    enrolled: 8,
    status: 'upcoming',
    category: 'Design',
    level: 'intermediate',
    createdAt: '2024-07-10T12:20:00Z',
    updatedAt: '2024-08-22T09:45:00Z'
  },
  {
    _id: 'train_005',
    title: 'DevOps and Cloud Computing',
    description: 'Learn modern DevOps practices including Docker, Kubernetes, CI/CD pipelines, and AWS cloud services.',
    instructor: 'Michael Brown',
    duration: 90,
    startDate: '2024-10-01',
    endDate: '2024-12-20',
    capacity: 18,
    enrolled: 5,
    status: 'upcoming',
    category: 'DevOps',
    level: 'advanced',
    createdAt: '2024-08-01T15:30:00Z',
    updatedAt: '2024-08-26T13:20:00Z'
  },
  {
    _id: 'train_006',
    title: 'Mobile App Development',
    description: 'Build cross-platform mobile applications using React Native and learn app deployment strategies.',
    instructor: 'Lisa Wang',
    duration: 75,
    startDate: '2024-06-01',
    endDate: '2024-07-30',
    capacity: 12,
    enrolled: 12,
    status: 'cancelled',
    category: 'Mobile Development',
    level: 'intermediate',
    createdAt: '2024-04-15T11:00:00Z',
    updatedAt: '2024-05-20T14:30:00Z'
  }
];

// Helper functions to get mock data
export const getMockPayments = (page: number = 1, limit: number = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    payments: mockPayments.slice(startIndex, endIndex),
    totalCount: mockPayments.length,
    totalPages: Math.ceil(mockPayments.length / limit),
    currentPage: page
  };
};

export const getMockCandidates = (page: number = 1, limit: number = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    candidates: mockCandidates.slice(startIndex, endIndex),
    totalCount: mockCandidates.length,
    totalPages: Math.ceil(mockCandidates.length / limit),
    currentPage: page
  };
};

export const getMockTrainings = (page: number = 1, limit: number = 10) => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  return {
    trainings: mockTrainings.slice(startIndex, endIndex),
    totalCount: mockTrainings.length,
    totalPages: Math.ceil(mockTrainings.length / limit),
    currentPage: page
  };
};
