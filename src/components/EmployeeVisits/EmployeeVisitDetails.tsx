import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { employeeVisitAPI, EmployeeVisit } from '../../services/employeeVisitAPI';
import { useAuthStore } from '../../store/authStore';
import { toast } from 'react-toastify';

const EmployeeVisitDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hasPermission } = useAuthStore();
  const [visit, setVisit] = useState<EmployeeVisit | null>(null);
  const [loading, setLoading] = useState(true);

  const canUpdate = hasPermission('employeeTravelLogs', 'update');

  useEffect(() => {
    if (id) fetchVisit(id);
  }, [id]);

  const fetchVisit = async (visitId: string) => {
    try {
      setLoading(true);
      const response = await employeeVisitAPI.getVisit(visitId);
      setVisit(response.data.log);
    } catch (error) {
      console.error('Error fetching visit:', error);
      toast.error('Failed to fetch visit details');
      navigate('/employee-visits');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-4">Loading...</div>;
  if (!visit) return <div className="p-4">Visit not found.</div>;

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      <div className="flex items-center gap-2 mb-4">
        <button className="btn btn-secondary" onClick={() => navigate(-1)} title="Back"><ArrowLeft /></button>
        <h1 className="text-2xl font-bold">Employee Visit Details</h1>
        {canUpdate && (
          <button className="btn btn-warning ml-auto" onClick={() => navigate(`/employee-visits/${visit._id}/edit`)} title="Edit"><Edit /></button>
        )}
      </div>
      <div className="bg-white rounded shadow p-6 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><strong>Employee ID:</strong> {visit.employeeId}</div>
          <div><strong>Login Time:</strong> {new Date(visit.loginTime).toLocaleString()}</div>
          <div><strong>Start Time:</strong> {new Date(visit.startTime).toLocaleString()}</div>
          <div><strong>End Time:</strong> {new Date(visit.endTime).toLocaleString()}</div>
          <div><strong>Work Hours:</strong> {visit.workHours}</div>
          <div><strong>Travel Duration:</strong> {visit.travelDuration}</div>
          <div><strong>Total Travel + Work Time:</strong> {visit.totalTravelWorkTime}</div>
          <div><strong>OT Hours:</strong> {visit.otHours}</div>
          <div><strong>Start From:</strong> {visit.startFrom}</div>
          <div><strong>Location:</strong> {visit.location}</div>
          <div><strong>Distance (km):</strong> {visit.distanceKm}</div>
          <div className="md:col-span-2"><strong>Purpose:</strong> {visit.purpose}</div>
        </div>
        <div className="text-xs text-gray-500 mt-4">
          Created: {visit.createdAt ? new Date(visit.createdAt).toLocaleString() : '-'}<br />
          Updated: {visit.updatedAt ? new Date(visit.updatedAt).toLocaleString() : '-'}
        </div>
      </div>
    </div>
  );
};

export default EmployeeVisitDetails; 