import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { cropsApi } from '../../api/endpoints/cropsApi';
import { aiApi } from '../../api/endpoints/aiApi';
import { districtList } from '../../utils/districtList';
import { PricePredictionCard } from '../../components/ui/PricePredictionCard';
import ListingInsightsPanel from '../../components/ai/ListingInsightsPanel';
import toast from 'react-hot-toast';
import { Upload, X, Loader2, ArrowLeft } from 'lucide-react';

const schema = yup.object().shape({
  cropName: yup.string().required('Crop name is required'),
  category: yup.string().required('Category is required'),
  harvestDate: yup.date().required('Harvest date is required'),
  quantity: yup.number().typeError('Must be a number').positive().required('Total quantity is required'),
  minOrderQty: yup.number().typeError('Must be a number').positive()
    .test('min-qty-check', 'Minimum order cannot exceed total quantity', function (value) {
      return value <= this.parent.quantity;
    }).required('Minimum order is required'),
  pricePerKg: yup.number().typeError('Must be a number').positive().required('Price is required'),
  grade: yup.string().oneOf(['A', 'B', 'C']).optional(),
  perishability: yup.string().oneOf(['high', 'medium', 'low']).required('Perishability is required'),
  description: yup.string(),
  district: yup.string().required('District is required'),
  taluka: yup.string(),
  village: yup.string(),
  farmerDelivers: yup.boolean(),
  buyerPickup: yup.boolean(),
  platformTransporter: yup.boolean(),
  deliveryCharge: yup.number().nullable().default(0),
}).test('delivery-check', null, (obj) => {
  if (!obj.farmerDelivers && !obj.buyerPickup && !obj.platformTransporter) {
    return new yup.ValidationError('Select at least one delivery option', null, 'farmerDelivers');
  }
  return true;
});

export const AddListing = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [primaryImage, setPrimaryImage] = useState(null);
  const [qualityAnalysis, setQualityAnalysis] = useState(null);
  const [qualityLoading, setQualityLoading] = useState(false);
  const [qualityError, setQualityError] = useState('');
  const [prediction, setPrediction] = useState(null);

  const { register, handleSubmit, watch, control, formState: { errors }, setValue, trigger } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      category: 'vegetable',
      grade: '',
      perishability: 'medium',
      district: user?.location?.district || '',
      buyerPickup: true,
      farmerDelivers: false,
      platformTransporter: false,
      deliveryCharge: 0
    }
  });

  const cropName = watch('cropName');
  const district = watch('district');
  const price = watch('pricePerKg');
  const farmerDelivers = watch('farmerDelivers');
  const canPublish = Boolean(primaryImage && qualityAnalysis?.grade && !submitting);

  useEffect(() => {
    if (qualityAnalysis?.grade) {
      setValue('grade', qualityAnalysis.grade, { shouldValidate: true, shouldDirty: true });
    }
  }, [qualityAnalysis, setValue]);

  useEffect(() => {
    const fetchPrediction = async () => {
      if (cropName?.length > 2 && district) {
        try {
          const res = await aiApi.getPricePrediction(cropName, district);
          if (res.data?.available) {
            setPrediction(res.data);
          } else {
            setPrediction(null);
          }
        } catch {
          setPrediction(null);
        }
      }
    };
    const timer = setTimeout(fetchPrediction, 800);
    return () => clearTimeout(timer);
  }, [cropName, district]);

  const analyzePrimaryImage = async (file, cropLabel) => {
    if (!file) return;

    setQualityLoading(true);
    setQualityError('');

    try {
      const response = await aiApi.analyzeQuality(file, cropLabel || watch('cropName'));
      if (response.data?.grade) {
        setQualityAnalysis(response.data);
        setValue('grade', response.data.grade, { shouldValidate: true, shouldDirty: true });
      } else {
        setQualityAnalysis(null);
        setQualityError('Quality analysis did not return a grade. Please try another image.');
      }
    } catch (error) {
      setQualityAnalysis(null);
      const message = error.response?.data?.message || 'Failed to analyze crop image';
      setQualityError(message);
      toast.error(message);
    } finally {
      setQualityLoading(false);
    }
  };

  const handlePrimaryImageChange = async (e) => {
    const files = Array.from(e.target.files);
    const selectedFile = files[0];

    if (!selectedFile) {
      return;
    }

    setPrimaryImage(selectedFile);
    await analyzePrimaryImage(selectedFile, watch('cropName'));
  };

  const removePrimaryImage = async () => {
    setQualityAnalysis(null);
    setQualityError('');

    setPrimaryImage(null);
    setValue('grade', '', { shouldValidate: true, shouldDirty: true });
  };

  const onSubmit = async (data) => {
    try {
      if (!primaryImage) {
        toast.error('Please upload a crop image for AI quality analysis');
        return;
      }

      if (!qualityAnalysis?.grade) {
        toast.error('Quality analysis is required before publishing');
        return;
      }

      setSubmitting(true);
      const formData = new FormData();

      formData.append('cropName', data.cropName);
      formData.append('category', data.category);
      formData.append('quantity', data.quantity);
      formData.append('minOrderQty', data.minOrderQty);
      formData.append('pricePerKg', data.pricePerKg);
      formData.append('grade', qualityAnalysis.grade);
      formData.append('perishability', data.perishability);
      formData.append('harvestDate', data.harvestDate);
      formData.append('description', data.description || '');
      formData.append('state', 'Maharashtra');
      formData.append('district', data.district);
      formData.append('taluka', data.taluka || '');
      formData.append('village', data.village || '');
      formData.append('farmerDelivers', data.farmerDelivers ? 'true' : 'false');
      formData.append('buyerPickup', data.buyerPickup ? 'true' : 'false');
      formData.append('platformTransporter', data.platformTransporter ? 'true' : 'false');
      formData.append('priceIncludesDelivery', data.farmerDelivers && !data.deliveryCharge ? 'true' : 'false');
      formData.append('additionalDeliveryCharge', String(data.deliveryCharge || 0));

      formData.append('images', primaryImage);

      await cropsApi.createListing(formData);
      toast.success('Listing published successfully!');
      navigate('/farmer/listings');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to publish listing');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        
        <div className="mb-6 flexItems-center">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-farm-dark flex items-center gap-1 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" /> Back to listings
          </button>
          <h1 className="text-3xl font-display font-bold text-farm-dark mt-4">Add new listing</h1>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          
          {/* Section 1: details */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">Crop Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">Crop Name *</label>
                <input {...register('cropName')} className={`w-full p-3 rounded-xl border ${errors.cropName ? 'border-red-500 bg-red-50' : 'border-gray-200'} focus:ring-2 focus:ring-farm-light outline-none`} placeholder="e.g. Alphonso Mangoes" />
                {errors.cropName && <p className="text-red-500 text-sm mt-1">{errors.cropName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">Category *</label>
                <select {...register('category')} className="w-full p-3 rounded-xl border border-gray-200 bg-white focus:ring-2 focus:ring-farm-light outline-none">
                  <option value="vegetable">🥬 Vegetable</option>
                  <option value="fruit">🍎 Fruit</option>
                  <option value="grain">🌾 Grain</option>
                  <option value="pulse">🫘 Pulse</option>
                  <option value="spice">🌶️ Spice</option>
                  <option value="other">🌿 Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">Total Quantity (kg) *</label>
                <input type="number" {...register('quantity')} className={`w-full p-3 rounded-xl border ${errors.quantity ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-farm-light outline-none`} placeholder="e.g. 500" />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">Minimum Order Qty (kg) *</label>
                <input type="number" {...register('minOrderQty')} className={`w-full p-3 rounded-xl border ${errors.minOrderQty ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-farm-light outline-none`} placeholder="e.g. 50" />
                {errors.minOrderQty && <p className="text-red-500 text-sm mt-1">{errors.minOrderQty.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-farm-dark mb-1">Price per kg (₹) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-3.5 text-gray-500">₹</span>
                  <input type="number" {...register('pricePerKg')} className={`w-full pl-8 p-3 rounded-xl border ${errors.pricePerKg ? 'border-red-500' : 'border-gray-200 text-xl font-bold'} focus:ring-2 focus:ring-farm-light outline-none`} placeholder="0.00" />
                </div>
                {errors.pricePerKg && <p className="text-red-500 text-sm mt-1">{errors.pricePerKg.message}</p>}
                
                {/* Lazy AI Prediction Component inside the form context */}
                {prediction && (
                  <div className="mt-4">
                    <PricePredictionCard cropName={cropName} district={district} userPrice={price} />
                  </div>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-farm-dark mb-1">Harvest Date *</label>
                <input type="date" {...register('harvestDate')} className={`w-full p-3 rounded-xl border ${errors.harvestDate ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-farm-light outline-none`} />
                {errors.harvestDate && <p className="text-red-500 text-sm mt-1">{errors.harvestDate.message}</p>}
              </div>
            </div>
          </div>

          <ListingInsightsPanel
            cropName={cropName}
            state={user?.location?.state || 'Maharashtra'}
            district={district}
            quantity={watch('quantity')}
            soilType={user?.soilType || user?.profile?.soilType}
          />

          {/* Section 2: Quality */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">Quality & Condition</h2>
            
            <div className="space-y-6">
              <div className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-lime-50 p-5 shadow-[0_10px_30px_rgba(16,185,129,0.08)]">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-emerald-600">Automatic crop grading</p>
                    <h3 className="mt-2 text-lg font-bold text-farm-dark">Use one image for grade, cover, and buyer preview</h3>
                    <p className="text-sm text-gray-600 mt-1 max-w-2xl">Upload the primary crop image once. The AI grade is selected automatically, the farmer cannot override it, and the same image becomes the listing cover on buyer screens.</p>
                  </div>
                  {qualityAnalysis?.grade && (
                    <div className={`inline-flex items-center rounded-full px-4 py-2 text-sm font-bold shadow-sm ${qualityAnalysis.grade === 'A' ? 'bg-green-100 text-green-800' : qualityAnalysis.grade === 'B' ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                      Grade {qualityAnalysis.grade}
                    </div>
                  )}
                </div>

                <div className="mt-5 grid gap-5 lg:grid-cols-[240px,1fr]">
                  <div className="relative overflow-hidden rounded-3xl border border-dashed border-emerald-200 bg-white p-4">
                    <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={handlePrimaryImageChange} className="absolute inset-0 h-full w-full cursor-pointer opacity-0" />
                    {primaryImage ? (
                      <div className="relative">
                        <img src={URL.createObjectURL(primaryImage)} alt="Primary crop" className="h-48 w-full rounded-xl object-cover" />
                        <button type="button" onClick={removePrimaryImage} className="absolute right-3 top-3 inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-md hover:bg-red-600">
                          <X className="h-4 w-4" />
                        </button>
                        <div className="absolute bottom-3 left-3 rounded-full bg-black/65 px-3 py-1 text-xs font-semibold text-white backdrop-blur">
                          Cover image for buyers
                        </div>
                      </div>
                    ) : (
                      <div className="flex h-48 flex-col items-center justify-center rounded-2xl border border-emerald-50 bg-emerald-50/40 text-center">
                        <Upload className="mb-3 h-10 w-10 text-emerald-500" />
                        <p className="font-medium text-farm-dark">Upload crop cover photo</p>
                        <p className="mt-1 text-xs text-gray-500">JPEG, PNG or WebP, up to 5MB</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4">
                    {qualityLoading && (
                      <div className="rounded-2xl border border-emerald-100 bg-white p-4 text-sm text-emerald-700">
                        Analyzing crop image... please wait.
                      </div>
                    )}

                    {qualityError && (
                      <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700">
                        {qualityError}
                      </div>
                    )}

                    {qualityAnalysis?.grade && (
                      <div className="rounded-3xl border border-gray-100 bg-white p-5 shadow-sm">
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <div>
                            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-400">Auto-selected grade</p>
                            <p className="mt-1 text-3xl font-bold text-farm-dark">Grade {qualityAnalysis.grade}</p>
                          </div>
                          <div className="rounded-full bg-green-50 px-4 py-1.5 text-sm font-semibold text-green-700">
                            Confidence {Math.round((qualityAnalysis.grade_confidence || 0) * 100)}%
                          </div>
                        </div>
                        <div className="mt-4 grid gap-3 sm:grid-cols-2">
                          <div className="rounded-2xl bg-emerald-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Freshness</p>
                            <p className="mt-1 text-sm font-semibold text-emerald-900">{qualityAnalysis.freshness}</p>
                          </div>
                          <div className="rounded-2xl bg-lime-50 p-3">
                            <p className="text-xs font-semibold uppercase tracking-wide text-lime-700">Marketability</p>
                            <p className="mt-1 text-sm font-semibold text-lime-900">{qualityAnalysis.marketability}</p>
                          </div>
                        </div>
                        <p className="mt-4 text-sm text-gray-600">
                          The grade is locked from the AI result and visible to buyers alongside the same cover image.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-farm-dark mb-3">Perishability (Shelf life)</label>
                <Controller name="perishability" control={control} render={({ field }) => (
                  <div className="flex flex-col sm:flex-row gap-3">
                    {[
                      { val: 'high', label: 'High (< 3 days)', color: 'red' },
                      { val: 'medium', label: 'Medium (3-7 days)', color: 'amber' },
                      { val: 'low', label: 'Low (> 7 days)', color: 'green' }
                    ].map(p => (
                      <button key={p.val} type="button" onClick={() => field.onChange(p.val)}
                        className={`flex-1 py-3 px-2 rounded-xl border font-medium text-sm transition-all ${
                          field.value === p.val
                          ? `bg-${p.color}-100 border-${p.color}-500 text-${p.color}-800 ring-2 ring-${p.color}-500/20`
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                )}/>
              </div>

              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">Description (Optional)</label>
                <textarea {...register('description')} rows={3} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-farm-light outline-none" placeholder="Add details about growing methods, specific variety, etc." />
              </div>
            </div>
          </div>

          {/* Section 3: Delivery */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">Delivery Options</h2>
            {errors.farmerDelivers && <p className="text-red-500 text-sm mb-4 bg-red-50 p-3 rounded-lg">{errors.farmerDelivers.message}</p>}
            
            <div className="space-y-4">
              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <h4 className="font-bold text-farm-dark">🚜 I can deliver to buyer</h4>
                  <p className="text-sm text-gray-500 mt-1">I have my own transport up to buyer location</p>
                </div>
                <input type="checkbox" {...register('farmerDelivers')} className="w-5 h-5 accent-farm-green" />
              </label>

              {farmerDelivers && (
                <div className="pl-6 border-l-2 border-farm-green ml-4 py-2">
                  <label className="block text-sm font-medium text-farm-dark mb-1">Additional delivery charge (₹)</label>
                  <input type="number" {...register('deliveryCharge')} className="w-full sm:w-1/2 p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-farm-light outline-none" placeholder="0 = Free delivery" />
                  <p className="text-xs text-gray-500 mt-1">Leave 0 if delivery is included in crop price.</p>
                </div>
              )}

              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors">
                <div>
                  <h4 className="font-bold text-farm-dark">📍 Buyer can pick up from my farm</h4>
                  <p className="text-sm text-gray-500 mt-1">Buyer arranges their own transport</p>
                </div>
                <input type="checkbox" {...register('buyerPickup')} className="w-5 h-5 accent-farm-green" />
              </label>

              <label className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:bg-purple-50 hover:border-purple-200 cursor-pointer transition-colors">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-bold text-farm-dark">🚛 Platform transporter</h4>
                    <span className="bg-purple-100 text-purple-800 text-xs font-bold px-2 py-0.5 rounded-full">Assured</span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Let KrishiMitra verify & assign an independent truck</p>
                </div>
                <input type="checkbox" {...register('platformTransporter')} className="w-5 h-5 accent-purple-600" />
              </label>
            </div>
          </div>

          {/* Section 4: Location */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">Farm Location</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">State</label>
                <input value="Maharashtra" disabled className="w-full p-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">District *</label>
                <select {...register('district')} className={`w-full p-3 rounded-xl border ${errors.district ? 'border-red-500' : 'border-gray-200'} bg-white focus:ring-2 focus:ring-farm-light outline-none`}>
                  <option value="">Select district</option>
                  {districtList.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <p className="text-red-500 text-sm mt-1">{errors.district.message}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">Taluka / Tehsil</label>
                <input {...register('taluka')} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-farm-light outline-none" placeholder="e.g. Baramati" />
              </div>
              <div>
                <label className="block text-sm font-medium text-farm-dark mb-1">Village</label>
                <input {...register('village')} className="w-full p-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-farm-light outline-none" placeholder="e.g. Malegaon Bk" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex flex-col-reverse sm:flex-row gap-4">
            <button type="button" onClick={() => navigate('/farmer/listings')} disabled={submitting} className="flex-1 py-4 border-2 border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-colors">
              Save as draft
            </button>
            <button type="submit" disabled={!canPublish} className="flex-1 py-4 bg-farm-green hover:bg-farm-dark disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors shadow-lg shadow-farm-green/30 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</> : canPublish ? 'Publish Listing' : 'Analyze quality first'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
