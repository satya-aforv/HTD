import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaEdit, FaArrowLeft, FaDownload, FaCalendarAlt, FaUser, FaChartLine, FaMoneyBillWave } from 'react-icons/fa';
import { htdAPI, Training } from '../../../services/htdAPI';
import toast from 'react-hot-toast';


const TrainingDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [training, setTraining] = useState<Training | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        setLoading(true);
        const data = await htdAPI.getTraining(id as string);
        setTraining(data);
      } catch (error) {
        console.error('Error fetching training details:', error);
        toast.error('Failed to fetch training details');
        navigate('/htd/trainings');
      } finally {
        setLoading(false);
      }
    };

    fetchTraining();
  }, [id, navigate]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const calculateDuration = (startDate: string, endDate: string | undefined) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    const months = Math.floor(diffDays / 30);
    const days = diffDays % 30;
    
    return `${months} month${months !== 1 ? 's' : ''} ${days} day${days !== 1 ? 's' : ''}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'on-hold':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getModuleStatusBadgeClass = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'in-progress':
        return 'bg-blue-100 text-blue-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleGenerateReport = async () => {
    try {
      toast.loading('Generating training report...');
      const blob = await htdAPI.getTrainingReport(id as string);
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `training-report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success('Training report generated successfully');
    } catch (error) {
      toast.dismiss();
      console.error('Error generating training report:', error);
      toast.error('Failed to generate training report');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="p-6 text-center text-red-500">
        Training record not found.
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/htd/trainings')}
            className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-2 rounded-full"
          >
            <FaArrowLeft />
          </button>
          <h1 className="text-2xl font-bold text-gray-800">
            Training Details
          </h1>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateReport}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md flex items-center gap-2"
          >
            <FaDownload /> Generate Report
          </button>
          <button
            onClick={() => navigate(`/htd/trainings/${id}/edit`)}
            className="bg-yellow-500 hover:bg-yellow-600 text-white py-2 px-4 rounded-md flex items-center gap-2"
          >
            <FaEdit /> Edit
          </button>
        </div>
      </div>

      {/* Training Header */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="flex flex-col md:flex-row justify-between">
          <div className="mb-4 md:mb-0">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {training.candidateId?.name}'s Training
            </h2>
            <div className="flex items-center gap-2 text-gray-600 mb-2">
              <FaCalendarAlt />
              <span>
                {formatDate(training.startDate)} - {training.endDate ? formatDate(training.endDate) : 'Present'}
              </span>
              <span className="text-gray-400">|</span>
              <span>Duration: {calculateDuration(training.startDate, training.endDate ?? undefined)}</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <FaUser />
              <span>{training.candidateId?.email}</span>
              <span className="text-gray-400">|</span>
              <span>{training.candidateId?.phone}</span>
            </div>
          </div>
          <div className="flex flex-col items-end">
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeClass(training.status)}`}>
              {training.status}
            </span>
            <div className="mt-2 flex items-center gap-4">
              <div className="text-right">
                <div className="text-sm text-gray-500">Average Rating</div>
                <div className="flex items-center">
                  <span className="text-lg font-semibold">{training.averageRating ? training.averageRating.toFixed(1) : 'N/A'}</span>
                  {training.averageRating != null && (
                    <div className="ml-1 flex">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`h-4 w-4 ${i < Math.round(training.averageRating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-gray-500">Total Expenses</div>
                <div className="text-lg font-semibold">${(training.totalExpenses ?? 0).toLocaleString()}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Skills */}
        {training.skillsAcquired && training.skillsAcquired.length > 0 && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Skills Acquired</h3>
            <div className="flex flex-wrap gap-2">
              {training.skillsAcquired.map((skill, index) => (
                <span key={index} className="bg-blue-100 text-blue-800 text-xs px-3 py-1 rounded-full">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Description */}
        {training.description && (
          <div className="mt-4">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Description</h3>
            <p className="text-gray-600">{training.description}</p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden mb-6">
        <div className="flex border-b">
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'overview' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'modules' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('modules')}
          >
            Modules
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'evaluations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('evaluations')}
          >
            Evaluations
          </button>
          <button
            className={`px-6 py-3 text-sm font-medium ${activeTab === 'expenses' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('expenses')}
          >
            Expenses
          </button>
        </div>

        <div className="p-6">
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Training Progress */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <FaChartLine className="text-blue-500" /> Training Progress
                  </h3>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Modules Completed</span>
                      <span className="text-sm font-medium text-gray-700">
                        {(training.modules || []).filter(m => m.status === 'completed').length}/{(training.modules || []).length}
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(training.modules || []).length > 0
                            ? ((training.modules || []).filter(m => m.status === 'completed').length / (training.modules || []).length) * 100
                            : 0}%`
                        }}
                      ></div>
                    </div>
                  </div>
                  <div className="mb-4">
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Time Elapsed</span>
                      <span className="text-sm font-medium text-gray-700">
                        {calculateDuration(training.startDate, training.endDate ?? undefined)}
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700">Status</span>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${getStatusBadgeClass(training.status)}`}>
                        {training.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Financial Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-3 flex items-center gap-2">
                    <FaMoneyBillWave className="text-green-500" /> Financial Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Total Expenses</span>
                      <span className="text-sm font-medium">${(training.totalExpenses ?? 0).toLocaleString()}</span>
                    </div>
                    {(training.expenses || []).length > 0 && (
                      <>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Stipends</span>
                          <span className="text-sm font-medium">
                            ${(training.expenses || [])
                              .filter(e => e.category === 'stipend')
                              .reduce((sum, e) => sum + e.amount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Training Materials</span>
                          <span className="text-sm font-medium">
                            ${(training.expenses || [])
                              .filter(e => e.category === 'materials' || e.category === 'training')
                              .reduce((sum, e) => sum + e.amount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Software</span>
                          <span className="text-sm font-medium">
                            ${(training.expenses || [])
                              .filter(e => e.category === 'software')
                              .reduce((sum, e) => sum + e.amount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600">Other</span>
                          <span className="text-sm font-medium">
                            ${(training.expenses || [])
                              .filter(e => e.category === 'other')
                              .reduce((sum, e) => sum + e.amount, 0)
                              .toLocaleString()}
                          </span>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Performance Summary */}
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-800 mb-3">Performance Summary</h3>
                  {(training.evaluations || []).length > 0 ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <div className="text-2xl font-bold">{(training.averageRating ?? 0).toFixed(1)}</div>
                        <div className="flex">
                          {[...Array(5)].map((_, i) => (
                            <svg key={i} className={`h-5 w-5 ${i < Math.round(training.averageRating ?? 0) ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </div>
                        <div className="text-sm text-gray-500">({(training.evaluations || []).length} evaluations)</div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Common Strengths</h4>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(
                            (training.evaluations || [])
                              .flatMap(e => e.strengths)
                              .filter(Boolean)
                          ))
                            .slice(0, 5)
                            .map((strength, index) => (
                              <span key={index} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                {strength}
                              </span>
                            ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-1">Areas for Improvement</h4>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(
                            (training.evaluations || [])
                              .flatMap(e => e.weaknesses)
                              .filter(Boolean)
                          ))
                            .slice(0, 5)
                            .map((weakness, index) => (
                              <span key={index} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                {weakness}
                              </span>
                            ))}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-gray-500 text-sm">No evaluations recorded yet.</div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {training.notes && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Additional Notes</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-600 whitespace-pre-line">{training.notes}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Modules Tab */}
          {activeTab === 'modules' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Training Modules</h3>
              {(training.modules || []).length > 0 ? (
                <div className="space-y-4">
                  {(training.modules || []).map((module) => (
                    <div key={module._id} className="border rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center bg-gray-50 p-4">
                        <div>
                          <h4 className="text-md font-medium text-gray-800">{module.name}</h4>
                          <div className="text-sm text-gray-500">
                            {formatDate(module.startDate)} - {module.endDate ? formatDate(module.endDate) : 'Ongoing'}
                          </div>
                        </div>
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getModuleStatusBadgeClass(module.status)}`}>
                          {module.status}
                        </span>
                      </div>
                      <div className="p-4">
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Description</h5>
                          <p className="text-sm text-gray-600">{module.description || 'No description provided.'}</p>
                        </div>
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Instructor</h5>
                          <p className="text-sm text-gray-600">{module.instructor || 'Not assigned'}</p>
                        </div>
                        {module.resources && module.resources.length > 0 && (
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Resources</h5>
                            <ul className="list-disc list-inside text-sm text-gray-600">
                              {module.resources.map((resource, i) => (
                                <li key={i}>{resource}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No modules have been added to this training yet.
                </div>
              )}
            </div>
          )}

          {/* Evaluations Tab */}
          {activeTab === 'evaluations' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Performance Evaluations</h3>
              {(training.evaluations || []).length > 0 ? (
                <div className="space-y-4">
                  {(training.evaluations || []).map((evaluation) => (
                    <div key={evaluation._id} className="border rounded-lg overflow-hidden">
                      <div className="flex justify-between items-center bg-gray-50 p-4">
                        <div>
                          <h4 className="text-md font-medium text-gray-800">Evaluation by {evaluation.evaluator}</h4>
                          <div className="text-sm text-gray-500">{formatDate(evaluation.date)}</div>
                        </div>
                        <div className="flex items-center">
                          <span className="text-sm font-medium text-gray-700 mr-2">{evaluation.rating}/5</span>
                          <div className="flex">
                            {[...Array(5)].map((_, i) => (
                              <svg key={i} className={`h-4 w-4 ${i < evaluation.rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="p-4">
                        <div className="mb-3">
                          <h5 className="text-sm font-medium text-gray-700 mb-1">Feedback</h5>
                          <p className="text-sm text-gray-600">{evaluation.feedback || 'No feedback provided.'}</p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Strengths</h5>
                            {evaluation.strengths && evaluation.strengths.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {evaluation.strengths.map((strength, i) => (
                                  <span key={i} className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full">
                                    {strength}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">None specified</p>
                            )}
                          </div>
                          <div>
                            <h5 className="text-sm font-medium text-gray-700 mb-1">Areas for Improvement</h5>
                            {evaluation.weaknesses && evaluation.weaknesses.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {evaluation.weaknesses.map((weakness, i) => (
                                  <span key={i} className="bg-red-100 text-red-800 text-xs px-2 py-1 rounded-full">
                                    {weakness}
                                  </span>
                                ))}
                              </div>
                            ) : (
                              <p className="text-sm text-gray-500">None specified</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No evaluations have been recorded for this training yet.
                </div>
              )}
            </div>
          )}

          {/* Expenses Tab */}
          {activeTab === 'expenses' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Training Expenses</h3>
              {(training.expenses || []).length > 0 ? (
                <div>
                  <div className="mb-6">
                    <h4 className="text-md font-medium text-gray-700 mb-2">Summary</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg">
                        <div className="text-sm text-blue-700">Total</div>
                        <div className="text-xl font-bold text-blue-800">
                          ${(training.totalExpenses ?? 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg">
                        <div className="text-sm text-green-700">Stipends</div>
                        <div className="text-xl font-bold text-green-800">
                          ${(training.expenses || [])
                            .filter(e => e.category === 'stipend')
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg">
                        <div className="text-sm text-purple-700">Training</div>
                        <div className="text-xl font-bold text-purple-800">
                          ${(training.expenses || [])
                            .filter(e => e.category === 'training')
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toLocaleString()}
                        </div>
                      </div>
                      <div className="bg-yellow-50 p-4 rounded-lg">
                        <div className="text-sm text-yellow-700">Materials</div>
                        <div className="text-xl font-bold text-yellow-800">
                          ${(training.expenses || [])
                            .filter(e => e.category === 'materials')
                            .reduce((sum, e) => sum + e.amount, 0)
                            .toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                          <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {(training.expenses || []).map((expense) => (
                          <tr key={expense._id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatDate(expense.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                expense.category === 'stipend' ? 'bg-green-100 text-green-800' :
                                expense.category === 'training' ? 'bg-purple-100 text-purple-800' :
                                expense.category === 'materials' ? 'bg-yellow-100 text-yellow-800' :
                                expense.category === 'software' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {expense.category}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-500">
                              {expense.description}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                              ${expense.amount.toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot className="bg-gray-50">
                        <tr>
                          <td colSpan={3} className="px-6 py-4 text-sm font-medium text-gray-900 text-right">Total</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                            ${(training.totalExpenses ?? 0).toLocaleString()}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No expenses have been recorded for this training yet.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default TrainingDetail;