import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { portfolioAPI, Portfolio } from '../../services/portfolioAPI';
import { statesAPI } from '../../services/statesAPI';
import { principleAPI } from '../../services/principleAPI';
import toast from 'react-hot-toast';
import { Save, ArrowLeft, Plus, Trash2, Loader2 } from 'lucide-react';
import Select from 'react-select';
import makeAnimated from 'react-select/animated';

interface State {
  _id: string;
  name: string;
  code: string;
}

interface PrincipleFormData {
  name: string;
  portfolios: string[];
  gstNumber: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isActive?: boolean;
  panNumber?: string;
}

const PrincipleForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [states, setStates] = useState<State[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [statesLoading, setStatesLoading] = useState(true);

  const { register, handleSubmit, setValue, control, formState: { errors } } = useForm<PrincipleFormData>({
    defaultValues: {
      isActive: true,
      portfolios: [],
    },
  });

  // For react-select integration
  const colorPalette = ['#3b82f6', '#10b981', '#f59e42', '#f43f5e', '#a21caf', '#eab308'];
  const portfolioOptions = portfolios.map((p, i) => ({
    value: p._id,
    label: p.name,
    color: colorPalette[i % colorPalette.length],
  }));
  const animatedComponents = makeAnimated();
  const selectStyles = {
    control: (base) => ({ ...base, borderColor: '#3b82f6', boxShadow: 'none', '&:hover': { borderColor: '#2563eb' } }),
    option: (base, state) => ({
      ...base,
      backgroundColor: state.isSelected
        ? '#3b82f6'
        : state.isFocused
        ? '#dbeafe'
        : undefined,
      color: state.isSelected ? 'white' : '#1e293b',
      fontWeight: state.isSelected ? 600 : 400,
    }),
    multiValue: (base, { data }) => ({
      ...base,
      backgroundColor: data.color,
      color: 'white',
    }),
    multiValueLabel: (base) => ({ ...base, color: 'white' }),
    multiValueRemove: (base) => ({ ...base, color: 'white', ':hover': { backgroundColor: '#1e293b', color: 'white' } }),
  };

  useEffect(() => {
    fetchPortfolios();
    fetchStates();
    if (isEdit && id) {
      fetchPrinciple(id);
    }
  }, [id, isEdit]);

  const fetchPortfolios = async () => {
    try {
      const response = await portfolioAPI.getPortfolios({ limit: 100 });
      setPortfolios(response.data.portfolios || []);
    } catch (error) {
      toast.error('Failed to fetch portfolios');
    }
  };

  const fetchStates = async () => {
    try {
      setStatesLoading(true);
      const response = await statesAPI.getStates({ limit: 100 });
      setStates(response.data.states || []);
    } catch (error) {
      toast.error('Failed to fetch states');
    } finally {
      setStatesLoading(false);
    }
  };

  const fetchPrinciple = async (principleId: string) => {
    try {
      setInitialLoading(true);
      const response = await principleAPI.getPrinciple(principleId);
      const principle = response.data.principle;
      setValue('name', principle.name);
      setValue('portfolios', principle.portfolios || []);
      setValue('gstNumber', principle.gstNumber);
      setValue('email', principle.email);
      setValue('phone', principle.phone);
      setValue('addressLine1', principle.addressLine1);
      setValue('addressLine2', principle.addressLine2 || '');
      setValue('city', principle.city);
      setValue('state', principle.state._id);
      setValue('pincode', principle.pincode);
      setValue('isActive', principle.isActive);
      setValue('panNumber', principle.panNumber || '');
    } catch (error) {
      toast.error('Failed to fetch principle');
      navigate('/principles');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: PrincipleFormData) => {
    setLoading(true);
    try {
      if (isEdit && id) {
        // Only update the main Principle fields, do not send contacts
        const { contacts, ...principleData } = data;
        await principleAPI.updatePrinciple(id, principleData);
        toast.success('Principle updated successfully');
      } else {
        // Separate contacts from main data
        const { contacts, ...principleData } = data;
        // 1. Create the Principle
        const response = await principleAPI.createPrinciple(principleData);
        const newPrincipleId = response.data.principle._id;
        // 2. If contacts were added, create them one by one
        if (contacts && contacts.length > 0) {
          for (const contact of contacts) {
            await principleAPI.createPrincipleContact(newPrincipleId, contact);
          }
        }
        toast.success('Principle created successfully');
      }
      navigate('/principles');
    } catch (error) {
      toast.error('Failed to save principle');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || statesLoading) {
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
          onClick={() => navigate('/principles')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Principle' : 'Add New Principle'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update principle information' : 'Create a new principle entry with contact details'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow-sm p-6 space-y-8">
        {/* Basic Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Basic Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Principle Name *
              </label>
              <input
                {...register('name', {
                  required: 'Principle name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter principle name"
              />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address *
              </label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Please enter a valid email address',
                  },
                })}
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter email address"
              />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number *
              </label>
              <input
                {...register('phone', {
                  required: 'Phone number is required',
                  minLength: { value: 10, message: 'Phone number must be at least 10 digits' },
                })}
                type="tel"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter phone number"
              />
              {errors.phone && <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Portfolios *
              </label>
              <Controller
                name="portfolios"
                control={control}
                rules={{ required: 'Select at least one portfolio' }}
                render={({ field }) => (
                  <Select
                    {...field}
                    isMulti
                    options={portfolioOptions}
                    classNamePrefix="react-select"
                    placeholder="Select portfolios..."
                    value={portfolioOptions.filter(option => field.value?.includes(option.value))}
                    onChange={selected => field.onChange(selected.map(option => option.value))}
                    components={animatedComponents}
                    styles={selectStyles}
                  />
                )}
              />
              {errors.portfolios && <p className="mt-1 text-sm text-red-600">{errors.portfolios.message}</p>}
            </div>
          </div>
        </div>

        {/* Registration Information */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Registration Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                GST Number *
              </label>
              <input
                {...register('gstNumber', {
                  required: 'GST number is required',
                  minLength: { value: 15, message: 'GST number must be exactly 15 characters' },
                  maxLength: { value: 15, message: 'GST number must be exactly 15 characters' },
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="Enter GST number"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.gstNumber && <p className="mt-1 text-sm text-red-600">{errors.gstNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                PAN Number
              </label>
              <input
                {...register('panNumber', {
                  validate: value => !value || value.length === 10 || 'PAN number must be exactly 10 characters',
                  setValueAs: v => v?.toUpperCase() || '',
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent uppercase"
                placeholder="Enter PAN number (optional)"
                style={{ textTransform: 'uppercase' }}
              />
              {errors.panNumber && <p className="mt-1 text-sm text-red-600">{errors.panNumber.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 1 *
              </label>
              <input
                {...register('addressLine1', {
                  required: 'Address Line 1 is required',
                  minLength: { value: 5, message: 'Address must be at least 5 characters' },
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Building/Street name"
              />
              {errors.addressLine1 && <p className="mt-1 text-sm text-red-600">{errors.addressLine1.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Address Line 2
              </label>
              <input
                {...register('addressLine2')}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Additional address info (optional)"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                City *
              </label>
              <input
                {...register('city', {
                  required: 'City is required',
                  minLength: { value: 2, message: 'City must be at least 2 characters' },
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter city name"
              />
              {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                State *
              </label>
              <select
                {...register('state', { required: 'State is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select State</option>
                {states.map((state) => (
                  <option key={state._id} value={state._id}>{state.name} ({state.code})</option>
                ))}
              </select>
              {errors.state && <p className="mt-1 text-sm text-red-600">{errors.state.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Pincode *
              </label>
              <input
                {...register('pincode', {
                  required: 'Pincode is required',
                  pattern: { value: /^[0-9]{6}$/, message: 'Pincode must be exactly 6 digits' },
                })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter pincode"
              />
              {errors.pincode && <p className="mt-1 text-sm text-red-600">{errors.pincode.message}</p>}
            </div>
          </div>
        </div>

        {/* Status */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-900 border-b border-gray-200 pb-2">
            Status
          </h3>
          <div>
            <label className="flex items-center">
              <input
                {...register('isActive')}
                type="checkbox"
                className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
              />
              <span className="ml-2 text-sm text-gray-700">Active Principle</span>
            </label>
            <p className="text-xs text-gray-500 mt-1">
              Inactive principles will be hidden from public listings
            </p>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
          <button
            type="button"
            onClick={() => navigate('/principles')}
            className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center transition-colors duration-200"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                {isEdit ? 'Update Principle' : 'Create Principle'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PrincipleForm; 