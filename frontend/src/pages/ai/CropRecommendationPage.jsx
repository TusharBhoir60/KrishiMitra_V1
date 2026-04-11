import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { Sprout, AlertCircle } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../api/axiosConfig';
import { useLanguage } from '../../context/LanguageContext';

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
  const { currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isFallback, setIsFallback] = useState(false);

  const text = currentLanguage === 'hi'
    ? {
        title: 'फसल सिफारिश',
        subtitle: 'अपनी मिट्टी के आधार पर AI से फसल सुझाव प्राप्त करें',
        unavailable: 'AI सेवा उपलब्ध नहीं है',
        unavailableMsg: 'AI सेवा अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
        recommend: 'फसल सुझाएं',
        recommending: 'सुझाव तैयार किए जा रहे हैं...',
        success: 'फसल सिफारिश सफलतापूर्वक तैयार हुई!',
        failed: 'फसल सिफारिश तैयार नहीं हो सकी'
      }
    : currentLanguage === 'mr'
      ? {
          title: 'पीक शिफारस',
          subtitle: 'मातीच्या प्रकारानुसार AI पीक शिफारसी मिळवा',
          unavailable: 'AI सेवा उपलब्ध नाही',
          unavailableMsg: 'AI सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.',
          recommend: 'पीक सुचवा',
          recommending: 'शिफारसी तयार होत आहेत...',
          success: 'पीक शिफारसी यशस्वीरीत्या तयार झाल्या!',
          failed: 'पीक शिफारसी तयार झाल्या नाहीत'
        }
      : {
          title: 'Crop Recommendation',
          subtitle: 'Select your soil profile and get AI-powered crop suggestions.',
          unavailable: 'AI Service Unavailable',
          unavailableMsg: 'AI service is currently unavailable. Please try again later.',
          recommend: 'Recommend Crops',
          recommending: 'Recommending...',
          success: 'Crop recommendations generated successfully!',
          failed: 'Failed to generate crop recommendations.'
        };

  const formText = currentLanguage === 'hi'
    ? {
        selectSoil: 'मिट्टी का प्रकार चुनें',
        showTop: 'शीर्ष',
        recommendations: 'सिफारिशें दिखाएं',
      }
    : currentLanguage === 'mr'
      ? {
          selectSoil: 'मातीचा प्रकार निवडा',
          showTop: 'शीर्ष',
          recommendations: 'शिफारसी दाखवा',
        }
      : {
          selectSoil: 'Select Soil Type',
          showTop: 'Show top',
          recommendations: 'recommendations',
        };

  const localizedSoils = SOIL_TYPES.map((soil) => {
    if (currentLanguage === 'hi') {
      const map = {
        loamy: { name: 'दोमट', description: 'अधिकांश फसलों के लिए उत्तम' },
        clay: { name: 'चिकनी', description: 'पानी रोकने वाली, घनी' },
        sandy: { name: 'बलुई', description: 'जल्दी पानी छोड़ती है, हल्की' },
        silt: { name: 'गाद', description: 'उपजाऊ और मुलायम' },
        black: { name: 'काली', description: 'पोषक तत्वों से भरपूर' },
        red: { name: 'लाल', description: 'लौह युक्त, अच्छी जल निकासी' },
      };
      return { ...soil, ...(map[soil.value] || {}) };
    }
    if (currentLanguage === 'mr') {
      const map = {
        loamy: { name: 'दोमट', description: 'बहुतेक पिकांसाठी सर्वोत्तम' },
        clay: { name: 'चिकण', description: 'पाणी धरून ठेवते, दाट' },
        sandy: { name: 'वालुकामय', description: 'लवकर निचरा, हलकी' },
        silt: { name: 'गाळयुक्त', description: 'सुपीक आणि मऊ' },
        black: { name: 'काळी', description: 'पोषकद्रव्यांनी समृद्ध' },
        red: { name: 'लाल', description: 'लोहयुक्त, चांगला निचरा' },
      };
      return { ...soil, ...(map[soil.value] || {}) };
    }
    return soil;
  });

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
        toast.success(text.success);
      } else if (response.data?.fallback) {
        setIsFallback(true);
        toast.error(text.unavailableMsg);
      } else {
        toast.error(text.failed);
      }
    } catch (error) {
      const message = error.response?.data?.message || text.failed;
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
            {text.title}
          </h1>
          <p className="text-gray-600 text-lg">
            {text.subtitle}
          </p>
        </div>

        {isFallback && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">{text.unavailable}</p>
              <p className="text-sm text-yellow-700">
                {text.unavailableMsg}
              </p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                {formText.selectSoil} <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {localizedSoils.map((soil) => {
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
                {formText.showTop} {topK} {formText.recommendations}
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
              {loading ? text.recommending : text.recommend}
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
