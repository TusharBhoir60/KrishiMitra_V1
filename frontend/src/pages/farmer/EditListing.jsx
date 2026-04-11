import { useParams, useNavigate } from 'react-router-dom';
import { Edit2, Save, Trash2 } from 'lucide-react';

export const EditListing = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  // Simplified placeholder allowing edits to an existing listing
  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-display font-bold text-farm-dark mb-6">Edit Listing</h1>
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <p className="text-gray-500">Edit listing ID: {id}</p>
          <div className="mt-6 flex gap-4">
            <button className="flex-1 bg-farm-green text-white py-3 rounded-xl font-bold hover:bg-farm-dark">Save Changes</button>
            <button onClick={() => navigate(-1)} className="flex-1 border-2 border-gray-200 text-gray-600 py-3 rounded-xl font-bold hover:bg-gray-50">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};
