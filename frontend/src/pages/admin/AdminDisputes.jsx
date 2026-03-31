import { useState, useEffect } from 'react';
import { adminApi } from '../../api/endpoints/adminApi';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { AlertCircle, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminDisputes = () => {
  const [disputes, setDisputes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDisputes = async () => {
    try {
      setLoading(true);
      const res = await adminApi.getDisputes();
      setDisputes(res.data?.data || []);
    } catch {
      toast.error('Failed to load disputes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDisputes(); }, []);

  const resolveDispute = async (id, resolution) => {
    try {
      await adminApi.resolveDispute(id, { resolutionNotes: resolution });
      toast.success('Dispute resolved');
      fetchDisputes();
    } catch {
      toast.error('Failed to resolve');
    }
  };

  if (loading) return <div className="p-6 max-w-5xl mx-auto"><SkeletonCard /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">Dispute Resolution HQ</h1>

        {disputes.length === 0 ? (
          <div className="bg-white p-12 text-center rounded-2xl border border-gray-200 shadow-sm">
            <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
            <h3 className="font-bold text-xl text-gray-900">All Clear!</h3>
            <p className="text-gray-500">There are no active disputes requiring admin attention.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {disputes.map(d => (
              <div key={d._id} className="bg-white p-6 rounded-2xl border-l-4 border-red-500 shadow-sm">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg flex items-center gap-2"><AlertCircle className="w-5 h-5 text-red-500"/> Order #{d._id.slice(-6)} Dispute</h3>
                    <p className="text-sm text-gray-500 mt-1">Disputed by: {d.buyer?.name} (Buyer) & {d.farmer?.name} (Farmer)</p>
                  </div>
                  <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-bold uppercase rounded-lg">Action Required</span>
                </div>
                
                <div className="bg-red-50 p-4 rounded-xl border border-red-100 mb-4">
                  <p className="text-xs uppercase font-bold text-red-400 mb-1">Reason provided</p>
                  <p className="text-red-900 font-medium">{d.disputeReason}</p>
                </div>

                <form onSubmit={(e) => {
                  e.preventDefault();
                  resolveDispute(d._id, e.target.notes.value);
                }}>
                  <textarea name="notes" placeholder="Enter admin resolution notes..." className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl mb-4 text-sm outline-none focus:border-blue-500" rows="3" required></textarea>
                  <div className="flex gap-4">
                    <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl text-sm">Force Refund Buyer</button>
                    <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded-xl text-sm">Dismiss Dispute</button>
                  </div>
                </form>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
