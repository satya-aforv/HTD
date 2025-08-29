import React, { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaSave, FaArrowLeft, FaPlus, FaTrash } from 'react-icons/fa';
import toast from 'react-hot-toast';
import { htdAPI, Training, Candidate, Module, Evaluation, Expense } from '../../../services/htdAPI';

const TrainingForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditMode = Boolean(id);

  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  
  const initialTrainingState: Partial<Training> = useMemo(() => ({
    candidateId: { _id: '', name: '' },
    startDate: '',
    endDate: '',
    status: 'active',
    description: '',
    modules: [],
    skillsAcquired: [],
    notes: ''
  }), []);

  const [training, setTraining] = useState<Partial<Training>>(initialTrainingState);

  const [newSkill, setNewSkill] = useState<string>('');
  const [newModule, setNewModule] = useState<Module>({
    name: '',
    description: '',
    startDate: '',
    endDate: '',
    status: 'pending',
    instructor: '',
    resources: []
  });
  const [newEvaluation, setNewEvaluation] = useState<Evaluation>({
    date: '',
    rating: 0,
    feedback: '',
    evaluator: '',
    strengths: [],
    weaknesses: []
  });
  const [newExpense, setNewExpense] = useState<Expense>({
    date: '',
    amount: 0,
    category: 'training',
    description: ''
  });

  // Fetch candidates for dropdown
  useEffect(() => {
    const fetchCandidates = async () => {
      try {
        const response = await htdAPI.getCandidates({});
        setCandidates(response.candidates);
      } catch (error) {
        console.error('Error fetching candidates:', error);
        toast.error('Failed to fetch candidates');
      }
    };

    fetchCandidates();
  }, []);

  // Fetch training data if in edit mode
  useEffect(() => {
    const fetchTraining = async () => {
      if (isEditMode) {
        try {
          setLoading(true);
          if (!id) return;
          const response = await htdAPI.getTraining(id);
          const trainingData = response;

          const formattedData = {
            ...initialTrainingState,
            ...trainingData,
            candidateId: trainingData.candidateId,
            startDate: trainingData.startDate ? new Date(trainingData.startDate).toISOString().split('T')[0] : '',
            endDate: trainingData.endDate ? new Date(trainingData.endDate).toISOString().split('T')[0] : '',
            modules: (trainingData.modules || []).map((module: Module) => ({
              ...module,
              startDate: module.startDate ? new Date(module.startDate).toISOString().split('T')[0] : '',
              endDate: module.endDate ? new Date(module.endDate).toISOString().split('T')[0] : '',
            })),
            evaluations: (trainingData.evaluations || []).map((evaluation: Evaluation) => ({
              ...evaluation,
              date: evaluation.date ? new Date(evaluation.date).toISOString().split('T')[0] : '',
            })),
            expenses: (trainingData.expenses || []).map((expense: Expense) => ({
              ...expense,
              date: expense.date ? new Date(expense.date).toISOString().split('T')[0] : '',
            })),
          };

          setTraining(formattedData);
        } catch (error) {
          console.error('Error fetching training:', error);
          toast.error('Failed to fetch training details');
          navigate('/htd/trainings');
        } finally {
          setLoading(false);
        }
      } else {
        setLoading(false);
      }
    };

    fetchTraining();
  }, [id, isEditMode, navigate, initialTrainingState]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setTraining((prev: Partial<Training>) => ({ ...prev, [name]: value }));
  };

  const handleCandidateChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    const selectedCandidate = candidates.find(c => c._id === value);
    setTraining(prev => ({ ...prev, candidateId: selectedCandidate || { _id: '', name: '' } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!training.candidateId) {
      toast.error('Please select a candidate');
      return;
    }

    try {
      setSubmitting(true);
      
      if (isEditMode) {
        if (!id) return;
        await htdAPI.updateTraining(id, training);
        toast.success('Training updated successfully');
      } else {
        await htdAPI.createTraining(training);
        toast.success('Training created successfully');
      }
      
      navigate('/htd/trainings');
    } catch (error) {
      console.error('Error saving training:', error);
      toast.error('Failed to save training');
    } finally {
      setSubmitting(false);
    }
  };

  // Skills management
  const addSkill = () => {
    if (newSkill.trim() && !(training.skillsAcquired || []).includes(newSkill.trim())) {
      setTraining((prev: Partial<Training>) => ({
        ...prev,
        skillsAcquired: [...(prev.skillsAcquired || []), newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setTraining((prev: Partial<Training>) => ({
      ...prev,
      skillsAcquired: (prev.skillsAcquired || []).filter((skill: string) => skill !== skillToRemove)
    }));
  };

  // Module management
  const handleModuleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewModule((prev: Module) => ({ ...prev, [name]: value }));
  };

  const addModule = () => {
    if (newModule.name.trim() && newModule.startDate) {
      setTraining((prev: Partial<Training>) => ({
        ...prev,
        modules: [...(prev.modules || []), { ...newModule }]
      }));
      setNewModule({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'pending',
        instructor: '',
        resources: []
      });
    } else {
      toast.error('Module name and start date are required');
    }
  };

  const removeModule = (index: number) => {
    setTraining((prev: Partial<Training>) => ({
      ...prev,
      modules: (prev.modules || []).filter((_: Module, i: number) => i !== index)
    }));
  };

  // Evaluation management
  const handleEvaluationChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewEvaluation((prev: Evaluation) => ({
      ...prev,
      [name]: name === 'rating' ? Number(value) : value
    }));
  };

  const addEvaluation = () => {
    if (newEvaluation.date && newEvaluation.evaluator) {
      setTraining((prev: Partial<Training>) => ({
        ...prev,
        evaluations: [...(prev.evaluations || []), { ...newEvaluation }]
      }));
      setNewEvaluation({
        date: '',
        rating: 0,
        feedback: '',
        evaluator: '',
        strengths: [],
        weaknesses: []
      });
    } else {
      toast.error('Evaluation date and evaluator are required');
    }
  };

  const removeEvaluation = (index: number) => {
    setTraining((prev: Partial<Training>) => ({
      ...prev,
      evaluations: (prev.evaluations || []).filter((_: Evaluation, i: number) => i !== index)
    }));
  };

  // Expense management
  const handleExpenseChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewExpense((prev: Expense) => ({
      ...prev,
      [name]: name === 'amount' ? Number(value) : value
    }));
  };

  const addExpense = () => {
    if (newExpense.date && newExpense.amount > 0 && newExpense.description) {
      setTraining((prev: Partial<Training>) => ({
        ...prev,
        expenses: [...(prev.expenses || []), { ...newExpense }]
      }));
      setNewExpense({
        date: '',
        amount: 0,
        category: 'training',
        description: ''
      });
    } else {
      toast.error('Expense date, amount, and description are required');
    }
  };

  const removeExpense = (index: number) => {
    setTraining((prev: Partial<Training>) => ({
      ...prev,
      expenses: (prev.expenses || []).filter((_: Expense, i: number) => i !== index)
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          {isEditMode ? 'Edit Training' : 'Add New Training'}
        </h1>
        <button
          onClick={() => navigate('/htd/trainings')}
          className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md flex items-center gap-2"
        >
          <FaArrowLeft /> Back to List
        </button>
      </div>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Candidate Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Candidate *
            </label>
            <select
              name="candidateId"
              value={training.candidateId?._id || ''}
              onChange={handleCandidateChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={isEditMode}
            >
              <option value="">Select Candidate</option>
              {candidates.map(candidate => (
                <option key={candidate._id} value={candidate._id}>
                  {candidate.name}
                </option>
              ))}
            </select>
          </div>

          {/* Training Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={training.status}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">Active</option>
              <option value="completed">Completed</option>
              <option value="on-hold">On Hold</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date *
            </label>
            <input
              type="date"
              name="startDate"
              value={training.startDate}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* End Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <input
              type="date"
              name="endDate"
              value={training.endDate || ''}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={training.description}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter training description..."
          ></textarea>
        </div>

        {/* Skills Acquired */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Skills Acquired
          </label>
          <div className="flex flex-wrap gap-2 mb-2">
            {(training.skillsAcquired || []).map((skill: string, index: number) => (
              <div key={index} className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-1">
                <span>{skill}</span>
                <button
                  type="button"
                  onClick={() => removeSkill(skill)}
                  className="text-blue-800 hover:text-blue-900 focus:outline-none"
                >
                  &times;
                </button>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
              className="flex-1 border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter skill..."
              onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())}
            />
            <button
              type="button"
              onClick={addSkill}
              className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md"
            >
              Add
            </button>
          </div>
        </div>

        {/* Training Modules Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Training Modules</h3>
          
          {/* List of Added Modules */}
          {(training.modules || []).length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instructor</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(training.modules || []).map((module: Module, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{module.name}</div>
                        <div className="text-sm text-gray-500">{module.description ? `${module.description.substring(0, 30)}${module.description.length > 30 ? '...' : ''}` : 'No description'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="text-sm text-gray-500">
                          {new Date(module.startDate).toLocaleDateString()} - 
                          {module.endDate ? new Date(module.endDate).toLocaleDateString() : 'Ongoing'}
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${module.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                          {module.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {module.instructor}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => removeModule(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Add New Module Form */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-md font-medium text-gray-700 mb-3">Add New Module</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Module Name *</label>
                <input
                  type="text"
                  name="name"
                  value={newModule.name}
                  onChange={handleModuleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter module name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                <input
                  type="text"
                  name="instructor"
                  value={newModule.instructor}
                  onChange={handleModuleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter instructor name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                <input
                  type="date"
                  name="startDate"
                  value={newModule.startDate}
                  onChange={handleModuleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={newModule.endDate}
                  onChange={handleModuleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  name="status"
                  value={newModule.status}
                  onChange={handleModuleChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="pending">Pending</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  name="description"
                  value={newModule.description}
                  onChange={handleModuleChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter module description"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addModule}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center gap-2"
              >
                <FaPlus /> Add Module
              </button>
            </div>
          </div>
        </div>

        {/* Evaluations Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Performance Evaluations</h3>
          
          {/* List of Added Evaluations */}
          {(training.evaluations || []).length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rating</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Evaluator</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Feedback</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(training.evaluations || []).map((evaluation: Evaluation, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(evaluation.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-900">{evaluation.rating}/5</span>
                          <div className="ml-2 flex">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`h-4 w-4 ${i < evaluation.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {evaluation.evaluator}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm text-gray-500">{evaluation.feedback ? `${evaluation.feedback.substring(0, 30)}${evaluation.feedback.length > 30 ? '...' : ''}` : 'No feedback'}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => removeEvaluation(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Add New Evaluation Form */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-md font-medium text-gray-700 mb-3">Add New Evaluation</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={newEvaluation.date}
                  onChange={handleEvaluationChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Evaluator *</label>
                <input
                  type="text"
                  name="evaluator"
                  value={newEvaluation.evaluator}
                  onChange={handleEvaluationChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter evaluator name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Rating (1-5)</label>
                <input
                  type="number"
                  name="rating"
                  value={newEvaluation.rating}
                  onChange={handleEvaluationChange}
                  min="1"
                  max="5"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Feedback</label>
                <textarea
                  name="feedback"
                  value={newEvaluation.feedback}
                  onChange={handleEvaluationChange}
                  rows={2}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter feedback"
                ></textarea>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addEvaluation}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center gap-2"
              >
                <FaPlus /> Add Evaluation
              </button>
            </div>
          </div>
        </div>

        {/* Expenses Section */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-800 mb-3">Training Expenses</h3>
          
          {/* List of Added Expenses */}
          {(training.expenses || []).length > 0 && (
            <div className="mb-4 overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(training.expenses || []).map((expense: Expense, index: number) => (
                    <tr key={index}>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {new Date(expense.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        ${expense.amount.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                        {expense.category}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500">
                        {expense.description}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          type="button"
                          onClick={() => removeExpense(index)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <FaTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {/* Add New Expense Form */}
          <div className="bg-gray-50 p-4 rounded-md">
            <h4 className="text-md font-medium text-gray-700 mb-3">Add New Expense</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  name="date"
                  value={newExpense.date}
                  onChange={handleExpenseChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount ($) *</label>
                <input
                  type="number"
                  name="amount"
                  value={newExpense.amount}
                  onChange={handleExpenseChange}
                  min="0"
                  step="0.01"
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  name="category"
                  value={newExpense.category}
                  onChange={handleExpenseChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="training">Training</option>
                  <option value="stipend">Stipend</option>
                  <option value="materials">Materials</option>
                  <option value="software">Software</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description *</label>
                <input
                  type="text"
                  name="description"
                  value={newExpense.description}
                  onChange={handleExpenseChange}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter expense description"
                />
              </div>
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                onClick={addExpense}
                className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-md flex items-center gap-2"
              >
                <FaPlus /> Add Expense
              </button>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Additional Notes
          </label>
          <textarea
            name="notes"
            value={training.notes || ''}
            onChange={handleChange}
            rows={3}
            className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter any additional notes..."
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={submitting}
            className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-md flex items-center gap-2 ${submitting ? 'opacity-70 cursor-not-allowed' : ''}`}
          >
            <FaSave /> {submitting ? 'Saving...' : 'Save Training'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default TrainingForm;