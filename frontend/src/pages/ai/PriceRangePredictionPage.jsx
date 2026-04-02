import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { AlertCircle, ChartNoAxesColumn } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../api/axiosConfig';
import { useLanguage } from '../../context/LanguageContext';

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
  { value: 12, label: 'December' },
];

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Winter', 'Summer', 'Whole Year'];

const schema = yup.object().shape({
  cropType: yup.string().required('Crop type is required').trim(),
  historicalAvgPrice: yup
    .number()
    .typeError('Historical average price is required')
    .required('Historical average price is required')
    .min(1, 'Historical average price must be at least 1'),
  state: yup.string().required('State is required').trim(),
  district: yup.string().required('District is required').trim(),
  quantity: yup
    .number()
    .typeError('Quantity is required')
    .required('Quantity is required')
    .positive('Quantity must be greater than 0'),
  month: yup
    .number()
    .typeError('Month is required')
    .required('Month is required')
    .min(1, 'Invalid month')
    .max(12, 'Invalid month'),
  season: yup.string().required('Season is required').oneOf(SEASONS, 'Invalid season'),
});

export const PriceRangePredictionPage = () => {
  const { currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [apiError, setApiError] = useState('');

  const text = currentLanguage === 'hi'
    ? {
        title: 'मूल्य सीमा पूर्वानुमान',
        subtitle: 'कम, आधार और उच्च मूल्य सीमा का अनुमान लगाएं',
        unavailable: 'AI सेवा उपलब्ध नहीं है',
        unavailableMsg: 'AI सेवा अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
        predict: 'मूल्य सीमा अनुमान करें',
        predicting: 'पूर्वानुमान किया जा रहा है...',
        success: 'मूल्य सीमा पूर्वानुमान सफलतापूर्वक तैयार हुआ!',
        failed: 'मूल्य सीमा पूर्वानुमान विफल रहा'
      }
    : currentLanguage === 'mr'
      ? {
          title: 'किंमत श्रेणी अंदाज',
          subtitle: 'किमान, आधार आणि कमाल बाजार किंमत श्रेणीचा अंदाज घ्या',
          unavailable: 'AI सेवा उपलब्ध नाही',
          unavailableMsg: 'AI सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.',
          predict: 'किंमत श्रेणी अंदाज लावा',
          predicting: 'अंदाज लावला जात आहे...',
          success: 'किंमत श्रेणी अंदाज यशस्वीरीत्या तयार झाला!',
          failed: 'किंमत श्रेणी अंदाज अयशस्वी झाला'
        }
      : {
          title: 'Price Range Prediction',
          subtitle: 'Forecast low, base, and high market price bands for your crop.',
          unavailable: 'AI Service Unavailable',
          unavailableMsg: 'AI service is currently unavailable. Please try again later.',
          predict: 'Predict Price Range',
          predicting: 'Predicting...',
          success: 'Price range prediction generated successfully!',
          failed: 'Failed to predict price range.'
        };

  const formText = currentLanguage === 'hi'
    ? {
        cropType: 'फसल प्रकार',
        cropTypePlaceholder: 'उदा., टमाटर',
        historicalAvgPrice: 'ऐतिहासिक औसत मूल्य',
        state: 'राज्य',
        district: 'जिला',
        quantity: 'मात्रा (किग्रा)',
        month: 'महीना',
        selectMonth: 'महीना चुनें',
        season: 'मौसम',
        selectSeason: 'मौसम चुनें',
      }
    : currentLanguage === 'mr'
      ? {
          cropType: 'पीक प्रकार',
          cropTypePlaceholder: 'उदा., टोमॅटो',
          historicalAvgPrice: 'ऐतिहासिक सरासरी किंमत',
          state: 'राज्य',
          district: 'जिल्हा',
          quantity: 'प्रमाण (कि.ग्रॅ.)',
          month: 'महिना',
          selectMonth: 'महिना निवडा',
          season: 'हंगाम',
          selectSeason: 'हंगाम निवडा',
        }
      : {
          cropType: 'Crop Type',
          cropTypePlaceholder: 'e.g. Tomato',
          historicalAvgPrice: 'Historical Avg Price',
          state: 'State',
          district: 'District',
          quantity: 'Quantity (kg)',
          month: 'Month',
          selectMonth: 'Select month',
          season: 'Season',
          selectSeason: 'Select season',
        };

  const monthLabels = currentLanguage === 'hi'
    ? ['जनवरी', 'फरवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर']
    : currentLanguage === 'mr'
      ? ['जानेवारी', 'फेब्रुवारी', 'मार्च', 'एप्रिल', 'मे', 'जून', 'जुलै', 'ऑगस्ट', 'सप्टेंबर', 'ऑक्टोबर', 'नोव्हेंबर', 'डिसेंबर']
      : MONTHS.map((m) => m.label);

  const seasonLabels = currentLanguage === 'hi'
    ? ['खरीफ', 'रबी', 'ज़ैद', 'सर्दी', 'गर्मी', 'पूरे वर्ष']
    : currentLanguage === 'mr'
      ? ['खरीफ', 'रब्बी', 'जायद', 'हिवाळा', 'उन्हाळा', 'पूर्ण वर्ष']
      : SEASONS;

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      cropType: '',
      historicalAvgPrice: '',
      state: '',
      district: '',
      quantity: '',
      month: '',
      season: '',
    },
  });

  const cropType = watch('cropType');
  const historicalAvgPrice = watch('historicalAvgPrice');
  const state = watch('state');
  const district = watch('district');
  const quantity = watch('quantity');
  const month = watch('month');
  const season = watch('season');

  useEffect(() => {
    if (result || isFallback || apiError) {
      setResult(null);
      setIsFallback(false);
      setApiError('');
    }
  }, [cropType, historicalAvgPrice, state, district, quantity, month, season]);

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    setIsFallback(false);
    setApiError('');

    try {
      const response = await api.post('/ml/predict-price-range', {
        cropType: data.cropType,
        historicalAvgPrice: Number(data.historicalAvgPrice),
        state: data.state,
        district: data.district,
        quantity: Number(data.quantity),
        month: Number(data.month),
        season: data.season,
      });

      if (response.data?.success && response.data?.data) {
        setResult(response.data.data);
        toast.success(text.success);
      } else if (response.data?.fallback) {
        setIsFallback(true);
        toast.error(text.unavailableMsg);
      } else {
        const msg = response.data?.message || text.failed;
        setApiError(msg);
        toast.error(msg);
      }
    } catch (error) {
      const message = error.response?.data?.message || text.failed;
      setApiError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const basePrice = result?.predicted_base_price_per_kg || 0;
  const lowPrice = result?.price_range?.low || 0;
  const highPrice = result?.price_range?.high || 0;
  const historical = Number(historicalAvgPrice || 0);

  const chartData = useMemo(
    () => [
      { label: 'Low', value: lowPrice, color: '#3b82f6' },
      { label: 'Base', value: basePrice, color: '#16a34a' },
      { label: 'High', value: highPrice, color: '#f97316' },
    ],
    [lowPrice, basePrice, highPrice]
  );

  const insight = useMemo(() => {
    if (!result || !historical) return { text: '', tone: '' };
    const diff = basePrice - historical;
    if (Math.abs(diff) < 0.0001) {
      return { text: '➡️ Predicted price matches historical average', tone: 'text-gray-600' };
    }

    const percent = ((Math.abs(diff) / historical) * 100).toFixed(2);
    if (diff > 0) {
      return {
        text: `📈 Predicted price is ${percent}% above historical average`,
        tone: 'text-green-700',
      };
    }

    return {
      text: `📉 Predicted price is ${percent}% below historical average`,
      tone: 'text-red-700',
    };
  }, [result, basePrice, historical]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <ChartNoAxesColumn className="w-10 h-10 text-green-600" />
            {text.title}
          </h1>
          <p className="text-gray-600 text-lg">{text.subtitle}</p>
        </div>

        {isFallback && (
          <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-yellow-800">{text.unavailable}</p>
              <p className="text-sm text-yellow-700">{text.unavailableMsg}</p>
            </div>
          </div>
        )}

        {apiError && !isFallback && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-700 font-medium">{apiError}</p>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.cropType} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={formText.cropTypePlaceholder}
                  {...register('cropType')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.cropType ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.cropType && <p className="text-red-600 text-sm mt-1">{errors.cropType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.historicalAvgPrice} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500">₹</span>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="0.00"
                    {...register('historicalAvgPrice')}
                    className={`w-full pl-9 pr-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                      errors.historicalAvgPrice ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                    }`}
                  />
                </div>
                {errors.historicalAvgPrice && (
                  <p className="text-red-600 text-sm mt-1">{errors.historicalAvgPrice.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.state} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('state')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.state ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.state && <p className="text-red-600 text-sm mt-1">{errors.state.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.district} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  {...register('district')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.district ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.district && <p className="text-red-600 text-sm mt-1">{errors.district.message}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.quantity} <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  {...register('quantity')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.quantity ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                />
                {errors.quantity && <p className="text-red-600 text-sm mt-1">{errors.quantity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.month} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('month')}
                  defaultValue=""
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.month ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                >
                  <option value="">{formText.selectMonth}</option>
                  {MONTHS.map((m) => (
                    <option key={m.value} value={m.value}>
                      {monthLabels[m.value - 1] || m.label}
                    </option>
                  ))}
                </select>
                {errors.month && <p className="text-red-600 text-sm mt-1">{errors.month.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.season} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('season')}
                  defaultValue=""
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 transition ${
                    errors.season ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-green-500'
                  }`}
                >
                  <option value="">{formText.selectSeason}</option>
                  {SEASONS.map((s, idx) => (
                    <option key={s} value={s}>
                      {seasonLabels[idx] || s}
                    </option>
                  ))}
                </select>
                {errors.season && <p className="text-red-600 text-sm mt-1">{errors.season.message}</p>}
              </div>
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
              {loading ? text.predicting : text.predict}
            </button>
          </form>
        </div>

        {result && !isFallback && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-8 text-center border border-green-100">
              <p className="text-sm text-gray-600 mb-2">Predicted Base Price</p>
              <p className="text-4xl font-extrabold text-green-600">₹{basePrice.toFixed(2)}/kg</p>
              <p className="text-sm text-gray-500 mt-2">Crop: {result.crop_type}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Price Range Visualization</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="label" />
                    <YAxis label={{ value: '₹ per kg', angle: -90, position: 'insideLeft' }} />
                    <Tooltip formatter={(value) => [`₹${Number(value).toFixed(2)}`, 'Price']} />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]}>
                      {chartData.map((entry) => (
                        <Cell key={entry.label} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">Price Summary</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-200 text-gray-700">
                      <th className="py-3 text-left">Label</th>
                      <th className="py-3 text-right">Price (₹/kg)</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-3">Low Estimate</td>
                      <td className="py-3 text-right font-semibold">₹{lowPrice.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-green-200 bg-green-50">
                      <td className="py-3 font-semibold">Predicted Base</td>
                      <td className="py-3 text-right font-bold text-green-700">₹{basePrice.toFixed(2)}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-3">High Estimate</td>
                      <td className="py-3 text-right font-semibold">₹{highPrice.toFixed(2)}</td>
                    </tr>
                    <tr>
                      <td className="py-3">Historical Avg</td>
                      <td className="py-3 text-right font-semibold">₹{historical.toFixed(2)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            <p className={`text-sm font-semibold ${insight.tone}`}>{insight.text}</p>

            <div className="text-center">
              <p className="text-xs text-gray-500">Model v{result.model_version || '1.0'}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceRangePredictionPage;
