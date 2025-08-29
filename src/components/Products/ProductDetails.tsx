
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { productAPI, Product } from '../../services/productAPI';
import { handleApiError } from '../../services/api';
import { useAuthStore } from '../../store/authStore';

const ProductDetails: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuthStore();
  const canUpdate = hasPermission('products', 'update');

  useEffect(() => {
    if (id) {
      fetchProduct(id);
    }
  }, [id]);

  const fetchProduct = async (productId: string) => {
    try {
      setLoading(true);
      const response = await productAPI.getProduct(productId);
      setProduct(response.data.product);
    } catch (error) {
      handleApiError(error);
      navigate('/products');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-10">
        <p className="text-lg text-gray-600">Product not found.</p>
        <Link to="/products" className="text-blue-600 hover:underline mt-4 inline-block">
          Back to Products List
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/products')}
            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Product Details</h1>
        </div>
        {canUpdate && (
          <Link
            to={`/products/${product._id}/edit`}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg"
          >
            <Edit className="w-4 h-4 mr-2" />
            Edit Product
          </Link>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium text-gray-900">{product.supplierName}</h3>
            <p className="text-sm text-gray-500">{product.productCode}</p>
          </div>
          <div className="md:text-right">
            <p className="text-sm text-gray-500">Principle</p>
            <p className="text-lg font-medium text-gray-900">{product.principle.name}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm text-gray-500">Description</p>
            <p className="text-gray-800">{product.description || 'No description provided.'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Distributor Price (DP)</p>
            <p className="text-lg font-medium text-gray-900">₹{product.dp.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Maximum Retail Price (MRP)</p>
            <p className="text-lg font-medium text-gray-900">₹{product.mrp.toFixed(2)}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Quantity</p>
            <p className="text-lg font-medium text-gray-900">{product.quantity}</p>
          </div>
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200 text-sm text-gray-500">
          <p>Created by: {product.createdBy.name} on {formatDate(product.createdAt)}</p>
          {product.updatedBy && (
            <p>Last updated by: {product.updatedBy.name} on {formatDate(product.updatedAt)}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
