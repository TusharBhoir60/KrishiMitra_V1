import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { AlertCircle, Lightbulb } from 'lucide-react';
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
  { value: 12, label: 'December' }
];

const SEASONS = ['Kharif', 'Rabi', 'Zaid', 'Winter', 'Summer', 'Whole Year'];

const schema = yup.object().shape({
  cropName: yup.string().required('Crop name is required').trim(),
  state: yup.string().required('State is required').trim(),
  month: yup.number()
    .typeError('Month is required')
    .required('Month is required')
    .min(1, 'Invalid month')
    .max(12, 'Invalid month'),
  season: yup.string()
    .required('Season is required')
    .oneOf(SEASONS, 'Invalid season'),
  forecastWeeks: yup.number()
    .typeError('Forecast weeks must be a number')
    .required('Forecast weeks is required')
    .min(1, 'Minimum 1 week')
    .max(8, 'Maximum 8 weeks'),
  historicalDemandScores: yup.string().nullable().optional().trim(),
  historicalPrices: yup.string().nullable().optional().trim()
});

const DemandBadge = ({ level, type = 'level' }) => {
  const configs = {
    high: { bg: 'bg-green-100', text: 'text-green-800', label: 'High' },
    medium: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Medium' },
    low: { bg: 'bg-red-100', text: 'text-red-800', label: 'Low' }
  };

  const style = configs[level] || configs.medium;

  return (
    <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${style.bg} ${style.text}`}>
      {style.label}
    </span>
  );
};

const RecommendationBanner = ({ recommendation }) => {
  return (
    <div className="mb-8 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-green-600 rounded-r-lg shadow-md">
      <div className="flex items-start gap-4">
        <Lightbulb className="w-8 h-8 text-green-600 flex-shrink-0 mt-0.5" />
        <div>
          <h3 className="font-bold text-gray-900 mb-2 text-lg">Forecast Recommendation</h3>
          <p className="text-gray-700 leading-relaxed">{recommendation}</p>
        </div>
      </div>
    </div>
  );
};

const ForecastChart = ({ chartData }) => {
  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-8">
      <h3 className="text-xl font-bold text-gray-800 mb-4">Weekly Demand Forecast</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis 
            domain={[0, 1]}
            label={{ value: 'Demand Score', angle: -90, position: 'insideLeft' }}
          />
          <Tooltip 
            formatter={(value) => value.toFixed(2)}
            contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db' }}
            content={({ active, payload }) => {
              if (active && payload && payload.length) {
                const data = payload[0].payload;
                return (
                  <div className="bg-white p-3 rounded border border-gray-300 shadow-lg">
                    <p className="font-semibold text-gray-900">{data.name}</p>
                    <p className="text-green-600 font-bold">Score: {data.demand_score.toFixed(2)}</p>
                    <p className="text-sm text-gray-600 capitalize">Level: {data.demand_label}</p>
                    <p className="text-sm text-gray-600 capitalize">Confidence: {data.confidence}</p>
                  </div>
                );
              }
              return null;
            }}
          />
          <Legend />
          <Line 
            type="monotone" 
            dataKey="demand_score" 
            stroke="#16a34a" 
            dot={{ fill: '#16a34a', r: 5 }}
            activeDot={{ r: 7 }}
            name="Demand Score"
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

const ForecastTable = ({ forecasts }) => {
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Week</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Demand Score</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Demand Level</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Confidence</th>
            </tr>
          </thead>
          <tbody>
            {forecasts.map((forecast, idx) => (
              <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50 transition">
                <td className="px-6 py-4 text-sm font-medium text-gray-900">Week {forecast.week}</td>
                <td className="px-6 py-4 text-sm text-gray-700 font-semibold text-green-600">
                  {forecast.demand_score.toFixed(2)}
                </td>
                <td className="px-6 py-4 text-sm">
                  <DemandBadge level={forecast.demand_label} type="level" />
                </td>
                <td className="px-6 py-4 text-sm">
                  <DemandBadge level={forecast.confidence} type="confidence" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const DemandForecastPage = () => {
  const { currentLanguage } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [modelVersion, setModelVersion] = useState('');
  const [forecastWeeksLabel, setForecastWeeksLabel] = useState('1');

  const text = currentLanguage === 'hi'
    ? {
        title: 'मांग पूर्वानुमान',
        subtitle: 'आने वाले सप्ताहों की मांग का अनुमान लगाएं',
        unavailable: 'AI सेवा उपलब्ध नहीं है',
        unavailableMsg: 'AI सेवा अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
        details: 'फसल विवरण दर्ज करें',
        forecast: 'मांग पूर्वानुमान करें',
        forecasting: 'पूर्वानुमान किया जा रहा है...',
        success: 'मांग पूर्वानुमान सफलतापूर्वक तैयार हुआ!',
        failed: 'मांग पूर्वानुमान तैयार नहीं हो सका',
        fetchFailed: 'मांग पूर्वानुमान प्राप्त नहीं हो सका। कृपया फिर प्रयास करें।'
      }
    : currentLanguage === 'mr'
      ? {
          title: 'मागणी अंदाज',
          subtitle: 'पुढील आठवड्यांसाठी मागणीचा अंदाज घ्या',
          unavailable: 'AI सेवा उपलब्ध नाही',
          unavailableMsg: 'AI सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.',
          details: 'पीक तपशील भरा',
          forecast: 'मागणी अंदाज लावा',
          forecasting: 'अंदाज लावला जात आहे...',
          success: 'मागणी अंदाज यशस्वीरीत्या तयार झाला!',
          failed: 'मागणी अंदाज तयार झाला नाही',
          fetchFailed: 'मागणी अंदाज मिळवता आला नाही. कृपया पुन्हा प्रयत्न करा.'
        }
      : {
          title: 'Demand Forecast',
          subtitle: 'Predict crop demand trends for the upcoming weeks to optimize your sales strategy',
          unavailable: 'AI Service Unavailable',
          unavailableMsg: 'The AI service is currently unavailable. Please try again later.',
          details: 'Enter Crop Details',
          forecast: 'Forecast Demand',
          forecasting: 'Forecasting...',
          success: 'Demand forecast generated successfully!',
          failed: 'Failed to generate demand forecast',
          fetchFailed: 'Failed to fetch demand forecast. Please try again.'
        };

  const formText = currentLanguage === 'hi'
    ? {
        cropName: 'फसल का नाम',
        cropNamePlaceholder: 'उदा., धान, गेहूं, कपास',
        state: 'राज्य',
        statePlaceholder: 'उदा., महाराष्ट्र, पंजाब',
        month: 'महीना',
        selectMonth: 'महीना चुनें',
        season: 'मौसम',
        selectSeason: 'मौसम चुनें',
        forecastWeeks: 'पूर्वानुमान सप्ताह',
        weeks: 'सप्ताह',
        week: 'सप्ताह',
        historicalDemand: 'ऐतिहासिक मांग स्कोर',
        historicalPrices: 'ऐतिहासिक कीमतें (₹/किग्रा)',
        optionalComma: '(वैकल्पिक, अल्पविराम से अलग)',
        demandPlaceholder: 'उदा., 0.6, 0.7, 0.8',
        pricesPlaceholder: 'उदा., 45.50, 48.00, 50.25',
      }
    : currentLanguage === 'mr'
      ? {
          cropName: 'पीक नाव',
          cropNamePlaceholder: 'उदा., तांदूळ, गहू, कापूस',
          state: 'राज्य',
          statePlaceholder: 'उदा., महाराष्ट्र, पंजाब',
          month: 'महिना',
          selectMonth: 'महिना निवडा',
          season: 'हंगाम',
          selectSeason: 'हंगाम निवडा',
          forecastWeeks: 'अंदाज आठवडे',
          weeks: 'आठवडे',
          week: 'आठवडा',
          historicalDemand: 'ऐतिहासिक मागणी गुण',
          historicalPrices: 'ऐतिहासिक किंमती (₹/कि.ग्रॅ.)',
          optionalComma: '(पर्यायी, स्वल्पविरामाने वेगळे)',
          demandPlaceholder: 'उदा., 0.6, 0.7, 0.8',
          pricesPlaceholder: 'उदा., 45.50, 48.00, 50.25',
        }
      : {
          cropName: 'Crop Name',
          cropNamePlaceholder: 'e.g., Rice, Wheat, Cotton',
          state: 'State',
          statePlaceholder: 'e.g., Maharashtra, Punjab',
          month: 'Month',
          selectMonth: 'Select a month',
          season: 'Season',
          selectSeason: 'Select a season',
          forecastWeeks: 'Forecast Weeks',
          weeks: 'weeks',
          week: 'week',
          historicalDemand: 'Historical Demand Scores',
          historicalPrices: 'Historical Prices (₹/kg)',
          optionalComma: '(Optional, comma-separated)',
          demandPlaceholder: 'e.g., 0.6, 0.7, 0.8',
          pricesPlaceholder: 'e.g., 45.50, 48.00, 50.25',
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

  const { register, handleSubmit, formState: { errors }, watch } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      cropName: '',
      state: '',
      month: '',
      season: '',
      forecastWeeks: 4,
      historicalDemandScores: '',
      historicalPrices: ''
    }
  });

  // Watch form fields to reset results
  const cropName = watch('cropName');
  const state = watch('state');
  const month = watch('month');
  const season = watch('season');
  const forecastWeeks = watch('forecastWeeks');
  const historicalDemandScores = watch('historicalDemandScores');
  const historicalPrices = watch('historicalPrices');

  useEffect(() => {
    if (result) {
      setResult(null);
      setIsFallback(false);
    }
  }, [cropName, state, month, season, forecastWeeks, historicalDemandScores, historicalPrices]);

  // Update label when forecastWeeks changes
  useEffect(() => {
    setForecastWeeksLabel(forecastWeeks || '1');
  }, [forecastWeeks]);

  const parseCommaSeparated = (str) => {
    if (!str || typeof str !== 'string') return undefined;
    const trimmed = str.trim();
    if (!trimmed) return undefined;
    return trimmed.split(',').map(v => {
      const num = parseFloat(v.trim());
      return isFinite(num) ? num : null;
    }).filter(v => v !== null);
  };

  const onSubmit = async (data) => {
    setLoading(true);
    setResult(null);
    setIsFallback(false);

    const payload = {
      cropName: data.cropName,
      state: data.state,
      month: parseInt(data.month),
      season: data.season,
      forecastWeeks: parseInt(data.forecastWeeks)
    };

    // Add optional arrays if provided
    const demandScores = parseCommaSeparated(data.historicalDemandScores);
    if (demandScores && demandScores.length > 0) {
      payload.historicalDemandScores = demandScores;
    }

    const prices = parseCommaSeparated(data.historicalPrices);
    if (prices && prices.length > 0) {
      payload.historicalPrices = prices;
    }

    try {
      const response = await api.post('/ai/demand', payload);

      if (response.data.success && response.data.data) {
        setResult(response.data.data);
        setModelVersion(response.data.data.model_version || '1.0');
        toast.success(text.success);
      } else if (response.data.fallback) {
        setIsFallback(true);
        toast.error(text.unavailableMsg, {
          duration: 5000
        });
      } else {
        toast.error(text.failed, {
          duration: 5000
        });
      }
    } catch (error) {
      console.error('Demand forecast error:', error);
      const errorMsg = error.response?.data?.message || text.fetchFailed;
      toast.error(errorMsg, {
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const chartData = result ? result.forecasts.map(f => ({
    name: `Week ${f.week}`,
    demand_score: f.demand_score,
    demand_label: f.demand_label,
    confidence: f.confidence,
    week: f.week
  })) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <Lightbulb className="w-10 h-10 text-green-600" />
            {text.title}
          </h1>
          <p className="text-gray-600 text-lg">
            {text.subtitle}
          </p>
        </div>

        {/* Fallback Warning Banner */}
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

        {/* Form Card */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{text.details}</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Crop Name & State - Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.cropName} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={formText.cropNamePlaceholder}
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
                  {formText.state} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={formText.statePlaceholder}
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

            {/* Month & Season - Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.month} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('month')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                    errors.month ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  defaultValue=""
                >
                  <option value="">{formText.selectMonth}</option>
                  {MONTHS.map((month) => (
                    <option key={month.value} value={month.value}>
                      {monthLabels[month.value - 1] || month.label}
                    </option>
                  ))}
                </select>
                {errors.month && (
                  <p className="text-red-600 text-sm mt-1">{errors.month.message}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {formText.season} <span className="text-red-500">*</span>
                </label>
                <select
                  {...register('season')}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                    errors.season ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                  }`}
                  defaultValue=""
                >
                  <option value="">{formText.selectSeason}</option>
                  {SEASONS.map((season, idx) => (
                    <option key={season} value={season}>
                      {seasonLabels[idx] || season}
                    </option>
                  ))}
                </select>
                {errors.season && (
                  <p className="text-red-600 text-sm mt-1">{errors.season.message}</p>
                )}
              </div>
            </div>

            {/* Forecast Weeks - Row 3 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formText.forecastWeeks}: <span className="font-bold text-green-600">{forecastWeeksLabel} {formText.weeks}</span> <span className="text-red-500">*</span>
              </label>
              <input
                type="range"
                min="1"
                max="8"
                step="1"
                {...register('forecastWeeks')}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-600"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>1 {formText.week}</span>
                <span>8 {formText.weeks}</span>
              </div>
              {errors.forecastWeeks && (
                <p className="text-red-600 text-sm mt-2">{errors.forecastWeeks.message}</p>
              )}
            </div>

            {/* Historical Demand Scores - Row 4 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formText.historicalDemand} <span className="text-gray-400 text-xs ml-1">{formText.optionalComma}</span>
              </label>
              <input
                type="text"
                placeholder={formText.demandPlaceholder}
                {...register('historicalDemandScores')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                  errors.historicalDemandScores ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.historicalDemandScores && (
                <p className="text-red-600 text-sm mt-1">{errors.historicalDemandScores.message}</p>
              )}
            </div>

            {/* Historical Prices - Row 5 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formText.historicalPrices} <span className="text-gray-400 text-xs ml-1">{formText.optionalComma}</span>
              </label>
              <input
                type="text"
                placeholder={formText.pricesPlaceholder}
                {...register('historicalPrices')}
                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition ${
                  errors.historicalPrices ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'
                }`}
              />
              {errors.historicalPrices && (
                <p className="text-red-600 text-sm mt-1">{errors.historicalPrices.message}</p>
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
                {loading ? text.forecasting : text.forecast}
              </button>
            </div>
          </form>
        </div>

        {/* Results Section */}
        {result && !isFallback && (
          <div className="animate-in fade-in-up duration-300 space-y-6">
            <RecommendationBanner recommendation={result.recommendation} />
            <ForecastChart chartData={chartData} />
            <ForecastTable forecasts={result.forecasts} />
            <div className="text-center">
              <p className="text-xs text-gray-500">Model v{modelVersion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DemandForecastPage;
