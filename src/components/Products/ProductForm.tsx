
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import { productAPI, ProductFormData } from '../../services/productAPI';
import { principleAPI } from '../../services/principleAPI';
import { handleApiError } from '../../services/api';

interface Principle {
  _id: string;
  name: string;
}

const ProductForm: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [principles, setPrinciples] = useState<Principle[]>([]);
  const [principlesLoading, setPrinciplesLoading] = useState(true);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>();

  useEffect(() => {
    fetchPrinciples();
    if (isEdit && id) {
      fetchProduct(id);
    }
  }, [id, isEdit]);

  const fetchPrinciples = async () => {
    try {
      setPrinciplesLoading(true);
      const response = await principleAPI.getPrinciples({ limit: 100 });
      setPrinciples(response.data.principles || []);
    } catch (error) {
      console.error('Error fetching principles:', error);
      handleApiError(error);
    } finally {
      setPrinciplesLoading(false);
    }
  };

  const fetchProduct = async (productId: string) => {
    try {
      setInitialLoading(true);
      const response = await productAPI.getProduct(productId);
      const product = response.data.product;
      
      setValue('supplierName', product.supplierName);
      setValue('productCode', product.productCode);
      setValue('principle', product.principle._id);
      setValue('dp', product.dp);
      setValue('mrp', product.mrp);
      setValue('description', product.description);
      setValue('quantity', product.quantity);
    } catch (error) {
      handleApiError(error);
      navigate('/products');
    } finally {
      setInitialLoading(false);
    }
  };

  const onSubmit = async (data: ProductFormData) => {
    setLoading(true);
    
    try {
      if (isEdit && id) {
        await productAPI.updateProduct(id, data);
        toast.success('Product updated successfully');
      } else {
        await productAPI.createProduct(data);
        toast.success('Product created successfully');
      }
      
      navigate('/products');
    } catch (error: any) {
      console.error('Submit error:', error);
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading || principlesLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/products')}
          className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors duration-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? 'Edit Product' : 'Add New Product'}
          </h1>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow-sm p-6"
      >
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="supplierName" className="block text-sm font-medium text-gray-700 mb-2">
                Supplier Name *
              </label>
              <input
                {...register('supplierName', { required: 'Supplier name is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.supplierName && <p className="mt-1 text-sm text-red-600">{errors.supplierName.message}</p>}
            </div>
            <div>
              <label htmlFor="productCode" className="block text-sm font-medium text-gray-700 mb-2">
                Product Code *
              </label>
              <input
                {...register('productCode', { required: 'Product code is required' })}
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.productCode && <p className="mt-1 text-sm text-red-600">{errors.productCode.message}</p>}
            </div>
            <div>
              <label htmlFor="principle" className="block text-sm font-medium text-gray-700 mb-2">
                Principle *
              </label>
              <select
                {...register('principle', { required: 'Principle is required' })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="">Select Principle</option>
                {principles.map(p => (
                  <option key={p._id} value={p._id}>{p.name}</option>
                ))}
              </select>
              {errors.principle && <p className="mt-1 text-sm text-red-600">{errors.principle.message}</p>}
            </div>
            <div>
              <label htmlFor="dp" className="block text-sm font-medium text-gray-700 mb-2">
                DP *
              </label>
              <input
                {...register('dp', { required: 'DP is required', valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.dp && <p className="mt-1 text-sm text-red-600">{errors.dp.message}</p>}
            </div>
            <div>
              <label htmlFor="mrp" className="block text-sm font-medium text-gray-700 mb-2">
                MRP *
              </label>
              <input
                {...register('mrp', { required: 'MRP is required', valueAsNumber: true })}
                type="number"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.mrp && <p className="mt-1 text-sm text-red-600">{errors.mrp.message}</p>}
            </div>
            <div>
              <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-2">
                Quantity *
              </label>
              <input
                {...register('quantity', { required: 'Quantity is required', valueAsNumber: true })}
                type="number"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
              {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                {...register('description')}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              ></textarea>
            </div>
          </div>

          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate('/products')}
              className="px-6 py-2 text-gray-700 bg-gray-100 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg flex items-center"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  {isEdit ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  {isEdit ? 'Update Product' : 'Create Product'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default ProductForm;
