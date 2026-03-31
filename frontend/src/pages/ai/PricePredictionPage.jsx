import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../api/axiosConfig';

const MONTHS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' }
];

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Winter', 'Summer', 'Whole Year'];

const schema = yup.object().shape({
  cropName: yup.string().required('Crop name is required').trim(),
  state: yup.string().required('State is required').trim(),
  district: yup.string().required('District is required').trim(),
  quantity: yup.number()
    .typeError('Quantity must be a number')
    .required('Quantity is required')
    .positive('Quantity must be greater than 0'),
  month: yup.number()
    .typeError('Month is required')
    .required('Month is required')
    .min(1, 'Invalid month')
    .max(12, 'Invalid month'),
  season: yup.string()
    .required('Season is required')
    .oneOf(SEASONS, 'Invalid season'),
  historicalAvgPrice: yup.number()
    .typeError('Historical avg price must be a number')
    .nullable()
    .positive('Must be a positive number')
    .optional()
});

const ConfidenceBadge = ({ confidence }) => {
  const config = {
    high: { bg: 'bg-green-100', text: 'text-green-800', label: 'High Confidence' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium Confidence' },
    low: { bg: 'bg-red-100', text: 'text-red-800', label: 'Low Confidence' }
  };

  const style = config[confidence] || config.medium;

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

const PriceChart = ({ chartData }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
        <TrendingUp className="w-5 h-5 text-green-600" />
        Price Range Analysis
      </h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            label={{ value: '₹ per kg', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value) => `₹${value.toFixed(2)}`}
            contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
          />
          <Legend />
          <Bar dataKey="price" fill="#3b82f6" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

const ResultCard = ({ result, modelVersion }) => {
  return (
    <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-8 rounded-lg shadow-lg border border-green-200 mt-8">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Price Prediction Result</h3>
          <p className="text-gray-600">Crop: <span className="font-semibold">{result.cropName}</span></p>
        </div>
        <CheckCircle2 className="w-8 h-8 text-green-600 flex-shrink-0" />
      </div>

      <div className="bg-white p-6 rounded-lg mb-6 border-l-4 border-green-600">
        <p className="text-gray-600 text-sm mb-2">Predicted Price per kg</p>
        <p className="text-4xl font-bold text-green-600 mb-4">
          ₹{result.predicted_price_per_kg.toFixed(2)}/kg
        </p>
        <div className="flex items-center justify-between">
          <ConfidenceBadge confidence={result.confidence} />
          <p className="text-xs text-gray-500">Model v{modelVersion}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-1">Min Price</p>
          <p className="text-2xl font-bold text-blue-600">₹{result.price_range.low.toFixed(2)}</p>
        </div>
        <div className="bg-white p-4 rounded-lg">
          <p className="text-gray-600 text-sm mb-1">Max Price</p>
          <p className="text-2xl font-bold text-orange-600">₹{result.price_range.high.toFixed(2)}</p>
        </div>
      </div>
    </div>
  );
};

export const PricePredictionPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [modelVersion, setModelVersion] = useState('');

  const { register, handleSubmit, control, formState: { errors }, watch, reset } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      cropName: '',
      state: '',
      district: '',
      quantity: '',
      month: '',
      season: '',
      historicalAvgPrice: ''
    }
  });

  // Reset result when form values change
  const cropName = watch('cropName');
  const state = watch('state');
  const district = watch('district');
  const quantity = watch('quantity');
  const month = watch('month');
  const season = watch('season');

  useEffect(() => {
    if (result) {
      setResult(null);
      setIsFallback(false);
    }
  }, [cropName, state, district, quantity, month, season]);

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    setIsFallback(false);

    // Build request payload
    const payload = {
      cropName: data.cropName,
      state: data.state,
      district: data.district,
      quantity: parseFloat(data.quantity),
      month: parseInt(data.month),
      season: data.season,
      ...(data.historicalAvgPrice && { historicalAvgPrice: parseFloat(data.historicalAvgPrice) })
    };

    try {
      const response = await api.post('/ai/price', payload);

      if (response.data.success && response.data.data) {
        setResult(response.data.data);
        setModelVersion(response.data.data.model_version || '1.0');
        toast.success('Price prediction generated successfully!');
      } else if (response.data.fallback) {
        setIsFallback(true);
        toast.error('AI service is currently unavailable. Please try again later.', {
          duration: 5000
        });
      } else {
        toast.error('Failed to generate price prediction', {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Price prediction error:', error);
      const errorMsg = error.response?.data?.message || 'Failed to fetch price prediction. Please try again.';
      toast.error(errorMsg, {
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? [
    { name: 'Low', price: result.price_range.low },
    { name: 'Predicted', price: result.predicted_price_per_kg },
    { name: 'High', price: result.price_range.high }
  ] : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <TrendingUp className="w-10 h-10 text-green-600" />
            Smart Price Prediction
          </h1>
          <p className="text-gray-600 text-lg">
            Get AI-powered crop price predictions based on market conditions and seasonal data
          </p>
        </div>

        {/* Fallback Warning Banner */}
        {isFallback && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">AI Service Unavailable</p>
              <p className="text-sm text-yellow-700">
                The AI service is currently unavailable. Please try again later.
              </p>
            </div>
          </div>
        )}

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">Enter Crop Details</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Crop Name & State - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Crop Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Rice, Wheat, Cotton"
                  {...register('cropName')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                    errors.cropName ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.cropName && (
                  <p className="text-red-600 text-sm mt-1">{errors.cropName.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  State <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Maharashtra, Punjab"
                  {...register('state')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                    errors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.state && (
                  <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>
                )}
              </div>
            </div>

            {/* District & Quantity - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  District <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g., Nashik, Pune"
                  {...register('district')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                    errors.district ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.district && (
                  <p className="text-red-600 text-sm mt-1">{errors.district.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Quantity (kg) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  placeholder="e.g., 100"
                  min="1"
                  step="0.01"
                  {...register('quantity')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                    errors.quantity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.quantity && (
                  <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>
                )}
              </div>
            </div>

            {/* Month & Season - Row 3 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Month <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('month')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                    errors.month ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  defaultValue=""
                >
                  <option value="">Select a month</option>
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {month.label}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className="text-red-600 text-sm mt-1">{errors.month.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Season <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('season')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                    errors.season ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  defaultValue=""
                >
                  <option value="">Select a season</option>
                  {SEASONS.map((season) => (
                    <option key={season} value={season}>
                      {season}
                    </option>
                  ))}
                </select>
                {errors.season && (
                  <p className="text-red-600 text-sm mt-1">{errors.season.message}</p>
                )}
              </div>
            </div>

            {/* Historical Avg Price - Row 4 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Historical Avg Price (₹/kg) <span className="text-gray-400 text-xs ml-1">(Optional)</span>
              </label>
              <input
                type="number"
                placeholder="e.g., 50.00"
                min="0"
                step="0.01"
                {...register('historicalAvgPrice')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                  errors.historicalAvgPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.historicalAvgPrice && (
                <p className="text-red-600 text-sm mt-1">{errors.historicalAvgPrice.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 px-6 rounded-lg font-semibold text-white text-lg transition duration-200 flex items-center justify-center gap-2 ${
                  loading
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-95 shadow-lg'
                }`}
              >
                {loading && <LoadingSpinner size="sm" className="flex items-center justify-center" />}
                {loading ? 'Predicting...' : 'Predict Price'}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {result && !isFallback && (
          <div className="animate-in fade-in-up duration-300">
            <ResultCard result={result} modelVersion={modelVersion} />
            <PriceChart chartData={chartData} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PricePredictionPage;
