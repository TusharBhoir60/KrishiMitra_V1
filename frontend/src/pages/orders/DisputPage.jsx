import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function DisputePage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [reason, setReason] = useState('');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!reason.trim()) return toast.error('Please select a reason');
    if (!details.trim()) return toast.error('Please enter dispute details');

    try {
      setSubmitting(true);

      // TODO: Replace with real API call once backend confirms endpoint.
      // Example:
      // await ordersApi.createDispute(id, { reason, details });

      await new Promise((r) => setTimeout(r, 600)); // temporary mock
      toast.success('Dispute submitted successfully');
      navigate(-1);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to submit dispute');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold text-farm-dark mb-2">Raise Dispute</h1>
        <p className="text-sm text-gray-600 mb-6">Order ID: {id}</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            >
              <option value="">Select reason</option>
              <option value="damaged_goods">Damaged goods</option>
              <option value="wrong_quantity">Wrong quantity</option>
              <option value="late_delivery">Late delivery</option>
              <option value="payment_issue">Payment issue</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Details
            </label>
            <textarea
              rows={5}
              value={details}
              onChange={(e) => setDetails(e.target.value)}
              placeholder="Explain the issue clearly..."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 disabled:opacity-60"
            >
              {submitting ? 'Submitting...' : 'Submit Dispute'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}