import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Save, Loader2, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { employeeVisitAPI, EmployeeVisit } from '../../services/employeeVisitAPI';
import { usersAPI } from '../../services/usersAPI';
import { useAuthStore } from '../../store/authStore';

const EmployeeVisitForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const { hasPermission } = useAuthStore();
  const [users, setUsers] = useState<{ _id: string; name: string }[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<EmployeeVisit>({
    defaultValues: {
      otHours: 0,
    },
  });

  useEffect(() => {
    if (isEdit && id) {
      fetchVisit(id);
    }
  }, [id, isEdit]);

  useEffect(() => {
    // Fetch users for the select dropdown
    const fetchUsers = async () => {
      try {
        setUsersLoading(true);
        const response = await usersAPI.getUsers({ limit: 100, designation: 'LOGISTICS AND SUPPLY' });
        setUsers(response.data.users || []);
      } catch (error) {
        console.error('Error fetching users:', error);
        toast.error('Failed to load users');
        setUsers([]);
      } finally {
        setUsersLoading(false);
      }
    };
    fetchUsers();
  }, []);

  const fetchVisit = async (visitId: string) => {
    try {
      setInitialLoading(true);
      const response = await employeeVisitAPI.getVisit(visitId);
      const visit = response.data.log;
      setValue('employeeId', visit.employeeId);
      setValue('loginTime', visit.loginTime?.slice(0, 16));
      setValue('startTime', visit.startTime?.slice(0, 16));
      setValue('endTime', visit.endTime?.slice(0, 16));
      setValue('workHours', visit.workHours);
      setValue('travelDuration', visit.travelDuration);
      setValue('totalTravelWorkTime', visit.totalTravelWorkTime);
      setValue('otHours', visit.otHours || 0);
      setValue('startFrom', visit.startFrom);
      setValue('location', visit.location);
      setValue('distanceKm', visit.distanceKm);
      setValue('purpose', visit.purpose);
    } catch (error) {
      console.error('Error fetching visit:', error);
      toast.error('Failed to fetch visit details');
      navigate('/logistic-logs');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: EmployeeVisit) => {
    setLoading(true);
    try {
      if (isEdit && id) {
        await employeeVisitAPI.updateVisit(id, data);
        toast.success('Visit updated successfully');
      } else {
        await employeeVisitAPI.createVisit(data);
        toast.success('Visit created successfully');
      }
      navigate('/logistic-logs');
    } catch (error) {
      console.error('Error saving visit:', error);
      toast.error('Failed to save visit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/logistic-logs')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Logistics Log' : 'Add New Logistics Log'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update logistics log information' : 'Create a new logistics log entry'}
          </p>
        </div>
      </div>

      {/* Form */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Employee *
                </label>
                <select
                  {...register('employeeId', { required: 'Employee is required' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={usersLoading}
                  defaultValue=""
                >
                  <option value="" disabled>
                    {usersLoading ? 'Loading employees...' : 'Select employee'}
                  </option>
                  {users.map((user) => (
                    <option key={user._id} value={user._id}>
                      {user.name}
                    </option>
                  ))}
                </select>
                {errors.employeeId && (
                  <p className="mt-1 text-sm text-red-600">{errors.employeeId.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Login Time *
                </label>
                <input
                  {...register('loginTime', { required: 'Login time is required' })}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.loginTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.loginTime.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start Time *
                </label>
                <input
                  {...register('startTime', { required: 'Start time is required' })}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.startTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.startTime.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  End Time *
                </label>
                <input
                  {...register('endTime', { required: 'End time is required' })}
                  type="datetime-local"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.endTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.endTime.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Work Hours *
                </label>
                <input
                  {...register('workHours', { required: 'Work hours are required' })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter work hours"
                />
                {errors.workHours && (
                  <p className="mt-1 text-sm text-red-600">{errors.workHours.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Travel Duration *
                </label>
                <input
                  {...register('travelDuration', { required: 'Travel duration is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 2h 30m"
                />
                {errors.travelDuration && (
                  <p className="mt-1 text-sm text-red-600">{errors.travelDuration.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Total Travel + Work Time *
                </label>
                <input
                  {...register('totalTravelWorkTime', { required: 'Total time is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. 8h 30m"
                />
                {errors.totalTravelWorkTime && (
                  <p className="mt-1 text-sm text-red-600">{errors.totalTravelWorkTime.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OT Hours
                </label>
                <input
                  {...register('otHours')}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter overtime hours"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Start From *
                </label>
                <input
                  {...register('startFrom', { required: 'Start location is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Bengaluru"
                />
                {errors.startFrom && (
                  <p className="mt-1 text-sm text-red-600">{errors.startFrom.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Location *
                </label>
                <input
                  {...register('location', { required: 'Destination is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g. Tirupati"
                />
                {errors.location && (
                  <p className="mt-1 text-sm text-red-600">{errors.location.message}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distance (km) *
                </label>
                <input
                  {...register('distanceKm', { required: 'Distance is required' })}
                  type="number"
                  step="0.01"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter distance in kilometers"
                />
                {errors.distanceKm && (
                  <p className="mt-1 text-sm text-red-600">{errors.distanceKm.message}</p>
                )}
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Purpose *
                </label>
                <input
                  {...register('purpose', { required: 'Purpose is required' })}
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Purpose of the visit"
                />
                {errors.purpose && (
                  <p className="mt-1 text-sm text-red-600">{errors.purpose.message}</p>
                )}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200 flex items-center gap-2 disabled:opacity-50"
              disabled={loading || initialLoading}
            >
              {loading ? <Loader2 className="animate-spin" /> : <Save />} {isEdit ? 'Update' : 'Save'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default EmployeeVisitForm; 