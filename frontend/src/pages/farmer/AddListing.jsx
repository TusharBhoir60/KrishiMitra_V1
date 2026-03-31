import { useState, useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Link, useNavigate } from 'react-router-dom';
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
  grade: yup.string().oneOf(['A', 'B', 'C']).required('Grade is required'),
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
  const [images, setImages] = useState([]);
  const [prediction, setPrediction] = useState(null);

  const { register, handleSubmit, watch, control, formState: { errors }, setValue, trigger } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      category: 'vegetable',
      grade: 'A',
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
        } catch (e) {
          setPrediction(null);
        }
      }
    };
    const timer = setTimeout(fetchPrediction, 800);
    return () => clearTimeout(timer);
  }, [cropName, district]);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (images.length + files.length > 3) {
      toast.error('Maximum 3 images allowed');
      return;
    }
    setImages(prev => [...prev, ...files]);
  };

  const removeImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const onSubmit = async (data) => {
    try {
      setSubmitting(true);
      const formData = new FormData();

      formData.append('cropName', data.cropName);
      formData.append('category', data.category);
      formData.append('quantity', data.quantity);
      formData.append('minOrderQty', data.minOrderQty);
      formData.append('pricePerKg', data.pricePerKg);
      formData.append('grade', data.grade);
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

      images.forEach((img) => {
        formData.append('images', img?.file || img);
      });

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
              <div>
                <label className="block text-sm font-medium text-farm-dark mb-3">Crop Grade</label>
                <Controller name="grade" control={control} render={({ field }) => (
                  <div className="flex gap-3">
                    {['A', 'B', 'C'].map(g => (
                      <button key={g} type="button" onClick={() => field.onChange(g)}
                        className={`flex-1 py-3 rounded-xl border font-bold transition-all ${
                          field.value === g 
                          ? g === 'A' ? 'bg-green-100 border-green-500 text-green-800 ring-2 ring-green-500/20' 
                            : g === 'B' ? 'bg-blue-100 border-blue-500 text-blue-800 ring-2 ring-blue-500/20'
                            : 'bg-amber-100 border-amber-500 text-amber-800 ring-2 ring-amber-500/20'
                          : 'border-gray-200 text-gray-500 hover:bg-gray-50'
                        }`}
                      >
                        Grade {g}
                      </button>
                    ))}
                  </div>
                )}/>
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

          {/* Section 3: Photos */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-6">Photos</h2>
            
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 p-3 rounded-lg border border-gray-100 inline-block">📷 Photos taken within 48 hours build buyer trust.</p>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors relative cursor-pointer">
              <input type="file" multiple accept=".jpg,.jpeg,.png,.webp" onChange={handleImageChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
              <Upload className="w-8 h-8 text-farm-light mx-auto mb-3" />
              <p className="text-farm-dark font-medium">Click or drag images here</p>
              <p className="text-sm text-gray-400 mt-1">Maximum 3 photos (up to 5MB each)</p>
            </div>

            {images.length > 0 && (
              <div className="flex gap-4 mt-6 overflow-x-auto pb-2">
                {images.map((file, i) => (
                  <div key={i} className="relative w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                    <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                    <button type="button" onClick={() => removeImage(i)} className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-md">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 4: Delivery */}
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

          {/* Section 5: Location */}
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
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-farm-green hover:bg-farm-dark text-white font-bold rounded-xl transition-colors shadow-lg shadow-farm-green/30 flex items-center justify-center gap-2">
              {submitting ? <><Loader2 className="w-5 h-5 animate-spin" /> Publishing...</> : 'Publish Listing'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
