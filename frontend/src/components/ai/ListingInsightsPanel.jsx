import { useEffect, useMemo, useState } from 'react';
import { BarChart, Bar, ResponsiveContainer, XAxis, Tooltip, Cell } from 'recharts';
import { ChevronDown, ChevronUp } from 'lucide-react';
import api from '../../api/axiosConfig';

const getCurrentMonthAndSeason = () => {
  const month = new Date().getMonth() + 1;
  let season = 'Zaid';

  if (month >= 6 && month <= 9) {
    season = 'Kharif';
  } else if (month >= 10 || month <= 2) {
    season = 'Rabi';
  }

  return { month, season };
};

const confidenceBadge = (confidence) => {
  if (confidence === 'high') {
    return 'bg-green-100 text-green-700 border-green-200';
  }
  if (confidence === 'low') {
    return 'bg-red-100 text-red-700 border-red-200';
  }
  return 'bg-yellow-100 text-yellow-700 border-yellow-200';
};

const confidenceLabel = (confidence) => {
  if (confidence === 'high') return 'High Confidence';
  if (confidence === 'low') return 'Low Confidence';
  return 'Medium Confidence';
};

const demandColor = (label) => {
  if (label === 'high') return '#16a34a';
  if (label === 'low') return '#ef4444';
  return '#eab308';
};

const LoaderSkeleton = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="h-16 bg-green-50 rounded-xl border border-green-100" />
      <div className="h-20 bg-green-50 rounded-xl border border-green-100" />
      <div className="h-14 bg-green-50 rounded-xl border border-green-100" />
    </div>
  );
};

const ListingInsightsPanel = ({ cropName, state, district, quantity, soilType }) => {
  const [expanded, setExpanded] = useState(true);
  const [loading, setLoading] = useState(false);
  const [fallback, setFallback] = useState(false);
  const [insights, setInsights] = useState({ price: null, demand: null, recommendation: null });

  const canFetch = useMemo(() => {
    return Boolean(cropName?.trim() && state?.trim() && Number(quantity) > 0);
  }, [cropName, state, quantity]);

  useEffect(() => {
    if (!canFetch) {
      setInsights({ price: null, demand: null, recommendation: null });
      setFallback(false);
      setLoading(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      setFallback(false);

      const { month, season } = getCurrentMonthAndSeason();
      const payload = {
        cropName: cropName?.trim(),
        state: state?.trim(),
        district: district?.trim() || undefined,
        quantity: Number(quantity),
        month,
        season,
        soilType: soilType || undefined,
        forecastWeeks: 4,
      };

      try {
        const response = await api.post('/ml/listing-insights', payload);

        if (response.data?.fallback || response.data?.success === false) {
          setFallback(true);
          setInsights({ price: null, demand: null, recommendation: null });
        } else {
          setInsights(response.data?.insights || { price: null, demand: null, recommendation: null });
        }
      } catch {
        setFallback(true);
        setInsights({ price: null, demand: null, recommendation: null });
      } finally {
        setLoading(false);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [canFetch, cropName, state, district, quantity, soilType]);

  if (fallback) {
    return null;
  }

  const hasAnyInsight = Boolean(insights.price || insights.demand || insights.recommendation);
  const normalizedCrop = (cropName || '').trim().toLowerCase();
  const topRec = insights.recommendation?.topRecommendation || '';
  const isTopMatch = topRec && normalizedCrop && topRec.toLowerCase() === normalizedCrop;

  const demandChartData = (insights.demand?.forecasts || []).slice(0, 4).map((item) => ({
    name: `W${item.week}`,
    demand_score: item.demand_score,
    demand_label: item.demand_label,
  }));

  if (!canFetch && !expanded) {
    return (
      <div className="bg-white border border-green-200 rounded-xl p-4">
        <button type="button" className="w-full flex items-center justify-between" onClick={() => setExpanded(true)}>
          <div>
            <p className="text-sm font-semibold text-green-900">🧠 AI Insights for Your Listing</p>
            <p className="text-xs text-gray-500">Based on your listing details</p>
          </div>
          <ChevronDown className="w-4 h-4 text-gray-500" />
        </button>
      </div>
    );
  }

  if (!canFetch) {
    return (
      <div className="bg-white border border-green-200 rounded-xl p-4">
        <button type="button" className="w-full flex items-center justify-between mb-3" onClick={() => setExpanded((p) => !p)}>
          <div className="text-left">
            <p className="text-sm font-semibold text-green-900">🧠 AI Insights for Your Listing</p>
            <p className="text-xs text-gray-500">Based on your listing details</p>
          </div>
          {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
        </button>

        {expanded && (
          <p className="text-sm text-gray-600">Fill in crop name, state and quantity to see AI insights</p>
        )}
      </div>
    );
  }

  if (!loading && !hasAnyInsight) {
    return null;
  }

  return (
    <div className="bg-white border border-green-200 rounded-xl p-4 shadow-sm">
      <button type="button" className="w-full flex items-center justify-between mb-3" onClick={() => setExpanded((p) => !p)}>
        <div className="text-left">
          <p className="text-sm font-semibold text-green-900">🧠 AI Insights for Your Listing</p>
          <p className="text-xs text-gray-500">Based on your listing details</p>
        </div>
        {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>

      {expanded && loading && (
        <>
          <p className="text-xs text-gray-500 mb-3">Fetching insights...</p>
          <LoaderSkeleton />
        </>
      )}

      {expanded && !loading && (
        <div className="space-y-4">
          {insights.price && (
            <section className="rounded-xl border border-green-100 bg-green-50/40 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Suggested Price</p>
              <p className="text-2xl font-bold text-green-700">
                ₹{Number(insights.price.predicted_price_per_kg || 0).toFixed(2)}/kg
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Range: ₹{Number(insights.price.price_range?.low || 0).toFixed(2)} - ₹
                {Number(insights.price.price_range?.high || 0).toFixed(2)}/kg
              </p>
              <div className="mt-3 flex items-center gap-2">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${confidenceBadge(insights.price.confidence)}`}>
                  {confidenceLabel(insights.price.confidence)}
                </span>
              </div>
              <p className="text-sm text-green-700 mt-2">
                💡 Consider pricing around ₹{Number(insights.price.predicted_price_per_kg || 0).toFixed(2)}/kg for best results
              </p>
            </section>
          )}

          {insights.demand && (
            <section className="rounded-xl border border-green-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Market Demand (Next 4 Weeks)</p>
              <div className="h-20">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={demandChartData}>
                    <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={10} />
                    <Tooltip
                      formatter={(value) => [Number(value).toFixed(2), 'Demand Score']}
                      labelFormatter={(label) => label}
                    />
                    <Bar dataKey="demand_score" radius={[4, 4, 0, 0]}>
                      {demandChartData.map((entry, idx) => (
                        <Cell key={`${entry.name}-${idx}`} fill={demandColor(entry.demand_label)} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs italic text-gray-500 mt-2">{insights.demand.recommendation}</p>
            </section>
          )}

          {insights.recommendation && (
            <section className="rounded-xl border border-green-100 bg-white p-4">
              <p className="text-xs uppercase tracking-wide text-gray-500 mb-2">Crop Suitability</p>

              {isTopMatch ? (
                <div className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-800 font-medium">
                  ✅ Great choice! {cropName} is well-suited for your soil.
                </div>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
                  <p className="font-medium">💡 AI suggests {topRec} may perform better.</p>
                  <p className="mt-1">
                    Other options: {insights.recommendation.recommendations?.[1] || '-'}, {insights.recommendation.recommendations?.[2] || '-'}
                  </p>
                </div>
              )}
            </section>
          )}
        </div>
      )}
    </div>
  );
};

export default ListingInsightsPanel;
