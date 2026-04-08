import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Upload, AlertCircle, Lightbulb, CheckCircle2, AlertTriangle, XCircle, RotateCcw } from 'lucide-react';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import api from '../../api/axiosConfig';
import { useLanguage } from '../../context/LanguageContext';

const ACCEPTED_FORMATS = ['image/jpeg', 'image/png', 'image/webp'];
const ACCEPTED_LABELS = 'JPEG, PNG, WebP';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const detectImageMimeFromBytes = async (selectedFile) => {
  const headerBuffer = await selectedFile.slice(0, 12).arrayBuffer();
  const bytes = new Uint8Array(headerBuffer);

  // JPEG: FF D8 FF
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47 &&
    bytes[4] === 0x0d &&
    bytes[5] === 0x0a &&
    bytes[6] === 0x1a &&
    bytes[7] === 0x0a
  ) {
    return 'image/png';
  }

  // WebP: RIFF....WEBP
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return 'image/webp';
  }

  return null;
};

const GradeCard = ({ grade, gradeConfidence }) => {
  const gradeConfig = {
    A: { bg: 'bg-green-500', label: 'Premium Quality', textColor: 'text-green-600' },
    B: { bg: 'bg-yellow-500', label: 'Good Quality', textColor: 'text-yellow-600' },
    C: { bg: 'bg-red-500', label: 'Below Standard', textColor: 'text-red-600' }
  };

  const config = gradeConfig[grade] || gradeConfig.B;
  const confidence = Math.round(gradeConfidence * 100);

  return (
    <div className="bg-white p-8 rounded-lg shadow-md text-center">
      <p className="text-gray-600 text-sm mb-4">Quality Grade</p>
      <div className={`w-32 h-32 mx-auto ${config.bg} rounded-full flex items-center justify-center mb-4 shadow-lg`}>
        <p className="text-white text-7xl font-bold">{grade}</p>
      </div>
      <p className={`text-2xl font-bold ${config.textColor} mb-4`}>{config.label}</p>
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-gray-600">Confidence</span>
          <span className="text-sm font-semibold text-gray-800">{confidence}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div 
            className={`h-3 rounded-full transition-all ${config.bg}`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const FreshnessCard = ({ freshness, freshnessConfidence }) => {
  const freshnessConfig = {
    fresh: { bg: 'bg-green-100', text: 'text-green-800', label: 'Best for Market', icon: '🌱' },
    moderate: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: 'Acceptable', icon: '⏱️' },
    stale: { bg: 'bg-red-100', text: 'text-red-800', label: 'Not Recommended', icon: '⚠️' }
  };

  const config = freshnessConfig[freshness] || freshnessConfig.moderate;
  const confidence = Math.round(freshnessConfidence * 100);

  return (
    <div className={`${config.bg} p-8 rounded-lg shadow-md border-l-4 ${config.text} border-l`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-sm opacity-75 mb-2">Freshness Level</p>
          <p className={`text-2xl font-bold ${config.text} capitalize flex items-center gap-2`}>
            <span>{config.icon}</span>
            {freshness}
          </p>
        </div>
      </div>
      <p className={`text-sm font-semibold ${config.text} mb-4`}>{config.label}</p>
      <div className="mb-2">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm opacity-75">Confidence</span>
          <span className="text-sm font-semibold">{confidence}%</span>
        </div>
        <div className="w-full bg-gray-300 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all ${
              freshness === 'fresh' ? 'bg-green-500' :
              freshness === 'moderate' ? 'bg-yellow-500' :
              'bg-red-500'
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
};

const MarketabilityBadge = ({ marketability }) => {
  const badgeConfig = {
    sellable: { bg: 'bg-green-100', text: 'text-green-800', icon: '✅', badge: 'Market Ready' },
    borderline: { bg: 'bg-yellow-100', text: 'text-yellow-800', icon: '⚠️', badge: 'Borderline' },
    reject: { bg: 'bg-red-100', text: 'text-red-800', icon: '❌', badge: 'Not Marketable' }
  };

  const config = badgeConfig[marketability] || badgeConfig.borderline;

  return (
    <div className={`${config.bg} px-6 py-4 rounded-lg inline-flex items-center gap-3`}>
      <span className="text-2xl">{config.icon}</span>
      <span className={`font-bold ${config.text}`}>{config.badge}</span>
    </div>
  );
};

const RecommendationsSection = ({ recommendations }) => {
  if (!recommendations || recommendations.length === 0) {
    return null;
  }

  return (
    <div className="bg-white p-8 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
        <Lightbulb className="w-6 h-6 text-green-600" />
        Recommendations
      </h3>
      <div className="space-y-4">
        {recommendations.map((rec, idx) => (
          <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
            <span className="text-2xl flex-shrink-0">💡</span>
            <p className="text-gray-800 leading-relaxed">{rec}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export const QualityAnalysisPage = () => {
  const { currentLanguage } = useLanguage();
  const [file, setFile] = useState(null);
  const [fileError, setFileError] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [isFallback, setIsFallback] = useState(false);
  const [modelVersion, setModelVersion] = useState('');
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  const { register, watch, formState: { errors } } = useForm({
    defaultValues: {
      cropName: ''
    }
  });

  const cropName = watch('cropName');

  const text = currentLanguage === 'hi'
    ? {
        title: 'गुणवत्ता विश्लेषण',
        subtitle: 'कंप्यूटर विज़न से फसल गुणवत्ता का AI विश्लेषण',
        unavailable: 'AI सेवा उपलब्ध नहीं है',
        unavailableMsg: 'AI सेवा अभी उपलब्ध नहीं है। कृपया बाद में पुनः प्रयास करें।',
        uploadTitle: 'फसल की छवि अपलोड करें',
        analyze: 'गुणवत्ता विश्लेषण करें',
        analyzing: 'विश्लेषण किया जा रहा है...',
        reset: 'रीसेट',
        analyzingMsg: 'छवि का विश्लेषण किया जा रहा है, कृपया प्रतीक्षा करें... (28 सेकंड तक)',
        success: 'गुणवत्ता विश्लेषण सफलतापूर्वक पूरा हुआ!',
        failed: 'छवि गुणवत्ता विश्लेषण विफल रहा',
        fetchFailed: 'छवि का विश्लेषण नहीं हो सका। कृपया फिर प्रयास करें।'
      }
    : currentLanguage === 'mr'
      ? {
          title: 'गुणवत्ता विश्लेषण',
          subtitle: 'कंप्युटर व्हिजनवर आधारित AI पीक गुणवत्ता विश्लेषण',
          unavailable: 'AI सेवा उपलब्ध नाही',
          unavailableMsg: 'AI सेवा सध्या उपलब्ध नाही. कृपया नंतर पुन्हा प्रयत्न करा.',
          uploadTitle: 'पीक प्रतिमा अपलोड करा',
          analyze: 'गुणवत्ता तपासा',
          analyzing: 'विश्लेषण सुरू आहे...',
          reset: 'रीसेट',
          analyzingMsg: 'प्रतिमा विश्लेषित केली जात आहे, कृपया थांबा... (28 सेकंदांपर्यंत)',
          success: 'गुणवत्ता विश्लेषण यशस्वीरीत्या पूर्ण झाले!',
          failed: 'प्रतिमेची गुणवत्ता तपासता आली नाही',
          fetchFailed: 'प्रतिमेचे विश्लेषण करता आले नाही. कृपया पुन्हा प्रयत्न करा.'
        }
      : {
          title: 'Quality Analysis',
          subtitle: 'AI-powered crop quality detection using computer vision analysis',
          unavailable: 'AI Service Unavailable',
          unavailableMsg: 'The AI service is currently unavailable. Please try again later.',
          uploadTitle: 'Upload Crop Image',
          analyze: 'Analyze Quality',
          analyzing: 'Analyzing...',
          reset: 'Reset',
          analyzingMsg: 'Analyzing image, please wait... (up to 28 seconds)',
          success: 'Quality analysis completed successfully!',
          failed: 'Failed to analyze image quality',
          fetchFailed: 'Failed to analyze image. Please try again.'
        };

  const formText = currentLanguage === 'hi'
    ? {
        cropImage: 'फसल की छवि',
        dragOrBrowse: 'छवि को यहां खींचें या चुनने के लिए क्लिक करें',
        maxLabel: 'अधिकतम 5MB',
        cropName: 'फसल का नाम',
        optional: '(वैकल्पिक)',
        cropNamePlaceholder: 'उदा., टमाटर, सेब, आम',
      }
    : currentLanguage === 'mr'
      ? {
          cropImage: 'पीक प्रतिमा',
          dragOrBrowse: 'प्रतिमा येथे ड्रॅग करा किंवा निवडण्यासाठी क्लिक करा',
          maxLabel: 'कमाल 5MB',
          cropName: 'पीक नाव',
          optional: '(पर्यायी)',
          cropNamePlaceholder: 'उदा., टोमॅटो, सफरचंद, आंबा',
        }
      : {
          cropImage: 'Crop Image',
          dragOrBrowse: 'Drag image here or click to browse',
          maxLabel: 'Max 5MB',
          cropName: 'Crop Name',
          optional: '(Optional)',
          cropNamePlaceholder: 'e.g., Tomato, Apple, Mango',
        };

  const validateFile = async (selectedFile) => {
    setFileError('');

    if (!selectedFile) {
      setFileError('No file selected');
      return false;
    }

    const detectedMime = await detectImageMimeFromBytes(selectedFile);
    if (!detectedMime || !ACCEPTED_FORMATS.includes(detectedMime)) {
      setFileError(`Invalid file format. Please upload ${ACCEPTED_LABELS} only.`);
      return { isValid: false, normalizedFile: null };
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      const sizeMB = (selectedFile.size / (1024 * 1024)).toFixed(2);
      setFileError(`File size (${sizeMB}MB) exceeds 5MB limit.`);
      return { isValid: false, normalizedFile: null };
    }

    const normalizedFile = selectedFile.type === detectedMime
      ? selectedFile
      : new File([selectedFile], selectedFile.name, {
          type: detectedMime,
          lastModified: selectedFile.lastModified,
        });

    return { isValid: true, normalizedFile };
  };

  const handleFileSelect = async (selectedFile) => {
    const { isValid, normalizedFile } = await validateFile(selectedFile);
    if (isValid && normalizedFile) {
      setFile(normalizedFile);
      setResult(null);
      setIsFallback(false);

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target.result);
      };
      reader.readAsDataURL(normalizedFile);
    }
  };

  const handleInputChange = async (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.add('border-green-500', 'bg-green-50');
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-green-500', 'bg-green-50');
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    dropZoneRef.current?.classList.remove('border-green-500', 'bg-green-50');

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      await handleFileSelect(droppedFile);
    }
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setFileError('Please select an image file');
      return;
    }

    setLoading(true);
    setResult(null);
    setIsFallback(false);

    const formData = new FormData();
    formData.append('file', file);
    if (cropName?.trim()) {
      formData.append('cropName', cropName.trim());
    }

    try {
      const response = await api.post('/ai/quality', formData);

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
      console.error('Quality analysis error:', error);
      const errorMsg = error.response?.data?.message || text.fetchFailed;
      toast.error(errorMsg, {
        duration: 5000
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setFileError('');
    setResult(null);
    setIsFallback(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-5xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
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
          <h2 className="text-2xl font-bold text-gray-800 mb-6">{text.uploadTitle}</h2>

          <form onSubmit={onSubmit} className="space-y-6">
            {/* Upload Zone */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formText.cropImage} <span className="text-red-500">*</span>
              </label>
              <div
                ref={dropZoneRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="relative border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer transition-colors hover:border-green-500 hover:bg-green-50"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPTED_FORMATS.join(',')}
                  onChange={handleInputChange}
                  className="hidden"
                  disabled={loading}
                />

                {preview ? (
                  <div className="flex flex-col items-center">
                    <img 
                      src={preview} 
                      alt="Preview" 
                      className="max-h-48 max-w-full rounded-lg mb-4 shadow-md"
                    />
                    <p className="text-sm font-semibold text-gray-700 text-center">{file?.name}</p>
                    <p className="text-xs text-gray-500">
                      {(file?.size / 1024).toFixed(2)} KB
                    </p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-green-600" />
                    <div className="text-center">
                      <p className="font-semibold text-gray-900">{formText.dragOrBrowse}</p>
                      <p className="text-sm text-gray-500 mt-1">
                        {ACCEPTED_LABELS} • {formText.maxLabel}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {fileError && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-700">{fileError}</p>
                </div>
              )}
            </div>

            {/* Crop Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {formText.cropName} <span className="text-gray-400 text-xs ml-1">{formText.optional}</span>
              </label>
              <input
                type="text"
                placeholder={formText.cropNamePlaceholder}
                {...register('cropName')}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 transition"
                disabled={loading}
              />
            </div>

            {/* Submit and Reset Buttons */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || !file}
                className={`flex-1 py-3 px-6 rounded-lg font-semibold text-white text-lg transition duration-200 flex items-center justify-center gap-2 ${
                  loading || !file
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 active:scale-95 shadow-lg'
                }`}
              >
                {loading && <LoadingSpinner size="sm" className="flex items-center justify-center" />}
                {loading ? text.analyzing : text.analyze}
              </button>
              {(file || result) && (
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="py-3 px-6 rounded-lg font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition border border-gray-300 flex items-center gap-2"
                >
                  <RotateCcw className="w-5 h-5" />
                  {text.reset}
                </button>
              )}
            </div>

            {/* Loading Message */}
            {loading && (
              <div className="flex items-center gap-2 text-green-700 bg-green-50 p-4 rounded-lg">
                <LoadingSpinner size="sm" className="flex items-center justify-center" />
                <span className="font-medium">{text.analyzingMsg}</span>
              </div>
            )}
          </form>
        </div>

        {/* Results Section */}
        {result && !isFallback && (
          <div className="animate-in fade-in-up duration-300 space-y-6">
            {/* Grade Card */}
            <GradeCard grade={result.grade} gradeConfidence={result.grade_confidence} />

            {/* Freshness & Marketability Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FreshnessCard freshness={result.freshness} freshnessConfidence={result.freshness_confidence} />
              
              <div className="bg-white p-8 rounded-lg shadow-md flex flex-col items-center justify-center">
                <p className="text-gray-600 text-sm mb-4">Marketability</p>
                <MarketabilityBadge marketability={result.marketability} />
              </div>
            </div>

            {/* Recommendations */}
            <RecommendationsSection recommendations={result.recommendations} />

            {/* Model Version */}
            <div className="text-center">
              <p className="text-xs text-gray-500">Model v{modelVersion}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default QualityAnalysisPage;
