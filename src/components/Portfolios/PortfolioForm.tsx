// 2. PortfolioForm component - src/components/Portfolio/PortfolioForm.tsx
import React from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { portfolioAPI } from '../../services/portfolioAPI';

const PortfolioForm: React.FC = () => {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const { register, handleSubmit, setValue } = useForm();

  React.useEffect(() => {
    if (isEdit && id) {
      portfolioAPI.getPortfolio(id).then(({ data }) => {
        setValue('name', data.name);
        setValue('description', data.description);
      });
    }
  }, [id, isEdit, setValue]);

  const onSubmit = async (data: any) => {
    try {
      if (isEdit && id) {
        await portfolioAPI.updatePortfolio(id, data);
      } else {
        await portfolioAPI.createPortfolio(data);
      }
      navigate('/portfolios');
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Portfolio' : 'Add New Portfolio'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update portfolio information' : 'Create a new portfolio entry'}
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
          <div>
            <label className="block text-sm font-medium">Portfolio Name</label>
            <input {...register('name', { required: true })} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium">Description</label>
            <textarea {...register('description')} className="w-full border p-2 rounded"></textarea>
          </div>
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
            {isEdit ? 'Update' : 'Create'} Portfolio
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default PortfolioForm;
