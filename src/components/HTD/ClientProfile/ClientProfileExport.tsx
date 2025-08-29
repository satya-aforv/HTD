import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { FaDownload, FaEye, FaSpinner } from 'react-icons/fa';
import toast from 'react-hot-toast';

interface ClientProfileData {
  personalInfo: {
    name: string;
    email: string;
    contactNumber: string;
    candidateId: string;
    status: string;
  };
  experience: {
    summary: {
      totalIT: string;
      totalNonIT: string;
      totalOverall: string;
    };
  };
  skills: {
    beforeTraining: any[];
    duringTraining: any[];
  };
  trainingHistory: any[];
  financialInvestment: {
    totalInvested: number;
    breakdown: any;
  };
  readinessScore: number;
}

const ClientProfileExport: React.FC = () => {
  const { candidateId } = useParams<{ candidateId: string }>();
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState<ClientProfileData | null>(null);
  const [showPreview, setShowPreview] = useState(false);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/htd/client-profile/${candidateId}`);
      setProfileData(response.data.data);
      setShowPreview(true);
    } catch (error) {
      console.error('Error fetching profile data:', error);
      toast.error('Failed to fetch profile data');
    } finally {
      setLoading(false);
    }
  };

  const exportToPDF = async () => {
    try {
      setLoading(true);
      toast.loading('Generating PDF...');
      
      const response = await axios.get(`/api/htd/client-profile/${candidateId}/pdf`, {
        responseType: 'blob'
      });
      
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `client-profile-${candidateId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      toast.dismiss();
      toast.success('PDF exported successfully');
    } catch (error) {
      toast.dismiss();
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF');
    } finally {
      setLoading(false);
    }
  };

  const getReadinessColor = (score: number) => {
    if (score >= 80) return 'text-green-600 bg-green-100';
    if (score >= 60) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Client Profile Export</h1>
        <div className="flex gap-2">
          <button
            onClick={fetchProfileData}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaEye />}
            Preview Profile
          </button>
          <button
            onClick={exportToPDF}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            {loading ? <FaSpinner className="animate-spin" /> : <FaDownload />}
            Export PDF
          </button>
        </div>
      </div>

      {showPreview && profileData && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="border-b pb-4 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-bold text-gray-800">{profileData.personalInfo.name}</h2>
                <p className="text-gray-600">Candidate ID: {profileData.personalInfo.candidateId}</p>
                <p className="text-gray-600">{profileData.personalInfo.email}</p>
                <p className="text-gray-600">{profileData.personalInfo.contactNumber}</p>
              </div>
              <div className="text-right">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${getReadinessColor(profileData.readinessScore)}`}>
                  Readiness Score: {profileData.readinessScore}%
                </span>
                <p className="text-sm text-gray-500 mt-2">Status: {profileData.personalInfo.status}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Experience Summary */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Experience Summary</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Total IT Experience:</span> {profileData.experience.summary.totalIT}</p>
                <p><span className="font-medium">Total Non-IT Experience:</span> {profileData.experience.summary.totalNonIT}</p>
                <p><span className="font-medium">Overall Experience:</span> {profileData.experience.summary.totalOverall}</p>
              </div>
            </div>

            {/* Financial Investment */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Financial Investment</h3>
              <div className="space-y-2">
                <p><span className="font-medium">Total Invested:</span> ${profileData.financialInvestment.totalInvested.toLocaleString()}</p>
                <p><span className="font-medium">Stipend:</span> ${profileData.financialInvestment.breakdown.stipend.toLocaleString()}</p>
                <p><span className="font-medium">Salary:</span> ${profileData.financialInvestment.breakdown.salary.toLocaleString()}</p>
                <p><span className="font-medium">Bonus:</span> ${profileData.financialInvestment.breakdown.bonus.toLocaleString()}</p>
              </div>
            </div>

            {/* Skills Before Training */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Skills Before Training</h3>
              <div className="space-y-1">
                {profileData.skills.beforeTraining.slice(0, 5).map((skill, index) => (
                  <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                    {skill.name} ({skill.proficiency})
                  </span>
                ))}
                {profileData.skills.beforeTraining.length > 5 && (
                  <span className="text-gray-500 text-sm">+{profileData.skills.beforeTraining.length - 5} more</span>
                )}
              </div>
            </div>

            {/* Skills During Training */}
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-3">Skills Acquired During Training</h3>
              <div className="space-y-1">
                {profileData.skills.duringTraining.slice(0, 5).map((skill, index) => (
                  <span key={index} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded text-sm mr-2 mb-1">
                    {skill.name} ({skill.proficiency})
                  </span>
                ))}
                {profileData.skills.duringTraining.length > 5 && (
                  <span className="text-gray-500 text-sm">+{profileData.skills.duringTraining.length - 5} more</span>
                )}
              </div>
            </div>
          </div>

          {/* Training History */}
          <div className="mt-6">
            <h3 className="text-lg font-medium text-gray-800 mb-3">Training History</h3>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Training ID</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Duration (Days)</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Rating</th>
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Skills Acquired</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {profileData.trainingHistory.map((training, index) => (
                    <tr key={index}>
                      <td className="px-4 py-2 text-sm text-gray-900">{training.trainingId}</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{training.duration}</td>
                      <td className="px-4 py-2 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          training.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          training.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-800' : 
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {training.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-sm text-gray-500">{training.averageRating.toFixed(1)}/5</td>
                      <td className="px-4 py-2 text-sm text-gray-500">{training.skillsAcquired.length}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 text-center">
              This profile is generated for client review and contains comprehensive candidate information including training performance, skills, and investment details.
            </p>
          </div>
        </div>
      )}

      {!showPreview && (
        <div className="bg-white rounded-lg shadow-md p-12 text-center">
          <FaEye className="mx-auto text-4xl text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-800 mb-2">Client Profile Preview</h3>
          <p className="text-gray-600 mb-4">Click "Preview Profile" to view the candidate's client-facing profile before exporting.</p>
        </div>
      )}
    </div>
  );
};

export default ClientProfileExport;
