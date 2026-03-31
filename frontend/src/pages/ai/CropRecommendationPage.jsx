import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Sprout, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../api/axiosConfig';

const SOIL_TYPES = [
  {
    value: 'loamy',
    name: 'Loamy',
    icon: '🟫',
    description: 'Best for most crops',
  },
  {
    value: 'clay',
    name: 'Clay',
    icon: '🧱',
    description: 'Water retentive, dense',
  },
  {
    value: 'sandy',
    name: 'Sandy',
    icon: '🏜️',
    description: 'Drains fast, light',
  },
  {
    value: 'silt',
    name: 'Silt',
    icon: '💧',
    description: 'Fertile and smooth',
  },
  {
    value: 'black',
    name: 'Black',
    icon: '⬛',
    description: 'Rich in nutrients',
  },
  {
    value: 'red',
    name: 'Red',
    icon: '🟥',
    description: 'Iron-rich, well-drained',
  },
];

const schema = yup.object().shape({
  soilType: yup
    .string()
    .required('Please select a soil type')
    .oneOf(['loamy', 'clay', 'sandy', 'silt', 'black', 'red'], 'Invalid soil type'),
  topK: yup
    .number()
    .typeError('Top K is required')
    .required('Top K is required')
    .min(1, 'Minimum 1')
    .max(10, 'Maximum 10'),
});

const rankBadge = (index) => {
  if (index === 0) return '🥇';
  if (index === 1) return '🥈';
  if (index === 2) return '🥉';
  return `${index + 1}`;
};

export const CropRecommendationPage = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  const {
    setValue,
    watch,
    handleSubmit,
    trigger,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      soilType: '',
      topK: 3,
    },
  });

  const soilType = watch('soilType');
  const topK = watch('topK');

  useEffect(() => {
    if (result || isFallback) {
      setResult(null);
      setIsFallback(false);
    }
  }, [soilType, topK]);

  const onSelectSoil = async (soil) => {
    setValue('soilType', soil, { shouldValidate: true, shouldDirty: true });
    await trigger('soilType');
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    setIsFallback(false);

    try {
      const response = await api.post('/ml/recommend-crop', {
        soilType: data.soilType,
        topK: Number(data.topK || 3),
      });

      if (response.data?.success) {
        setResult(response.data);
        toast.success('Crop recommendations generated successfully!');
      } else if (response.data?.fallback) {
        setIsFallback(true);
        toast.error('AI service is currently unavailable. Please try again later.');
      } else {
        toast.error('Failed to generate crop recommendations.');
      }
    } catch (error) {
      const message = error.response?.data?.message || 'Failed to generate crop recommendations.';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Sprout className="w-10 h-10 text-green-600" />
            Crop Recommendation
          </h1>
          <p className="text-gray-600 text-lg">
            Select your soil profile and get AI-powered crop suggestions.
          </p>
        </div>

        {isFallback && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">AI Service Unavailable</p>
              <p className="text-sm text-yellow-700">
                AI service is currently unavailable. Please try again later.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Select Soil Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {SOIL_TYPES.map((soil) => {
                  const selected = soilType === soil.value;
                  return (
                    <button
                      key={soil.value}
                      type="button"
                      onClick={() => onSelectSoil(soil.value)}
                      className={`text-left p-4 rounded-xl border transition-all duration-150 ${
                        selected
                          ? 'border-green-600 bg-green-50 shadow-sm shadow-green-100'
                          : 'border-gray-200 hover:border-green-300 hover:bg-green-50/40'
                      }`}
                    >
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-2xl">{soil.icon}</span>
                        <p className="font-semibold text-gray-900">{soil.name}</p>
                      </div>
                      <p className="text-sm text-gray-600">{soil.description}</p>
                    </button>
                  );
                })}
              </div>
              {errors.soilType && <p className="text-red-600 text-sm mt-2">{errors.soilType.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Show top {topK} recommendations
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={topK}
                onChange={(e) => setValue('topK', Number(e.target.value), { shouldValidate: true, shouldDirty: true })}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1</span>
                <span>10</span>
              </div>
              {errors.topK && <p className="text-red-600 text-sm mt-2">{errors.topK.message}</p>}
            </div>

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
              {loading ? 'Recommending...' : 'Recommend Crops'}
            </button>
          </form>
        </div>

        {result && !isFallback && (
          <div className="space-y-6">
            <p className="text-sm text-gray-500">
              Recommendations for <span className="font-semibold capitalize">{soilType}</span> soil
            </p>

            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-green-100 animate-pulse">
              <div className="text-4xl mb-2">🌟</div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Best Crop for Your Soil</h2>
              <p className="text-4xl font-extrabold text-green-600">{result.topRecommendation}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">All Recommended Crops</h3>
              <div className="space-y-3">
                {result.recommendations?.map((crop, index) => (
                  <div
                    key={`${crop}-${index}`}
                    className="flex items-center gap-4 p-4 rounded-lg border border-gray-200 hover:bg-green-50/40 hover:border-green-200 transition"
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg font-semibold">
                      {rankBadge(index)}
                    </div>
                    <p className="text-lg font-semibold text-gray-900">{crop}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CropRecommendationPage;
