import { useState, useEffect } from 'react';
import { adminApi } from '../../api/endpoints/adminApi';
import { SkeletonCard } from '../../components/common/SkeletonCard';
import { CheckCircle, XCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const res = await adminApi.getUsers();
      setUsers(res.data?.data || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleVerify = async (id, currentStatus) => {
    try {
      await adminApi.verifyUser(id, { isVerified: !currentStatus });
      toast.success('User verification updated');
      fetchUsers();
    } catch {
      toast.error('Failed update');
    }
  };

  if (loading) return <div className="p-6 max-w-7xl mx-auto"><SkeletonCard /></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-20 pt-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <h1 className="text-3xl font-display font-bold text-gray-900 mb-8">User Management</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200 text-sm font-bold text-gray-500 uppercase tracking-widest">
                <th className="p-4">Name</th>
                <th className="p-4">Role</th>
                <th className="p-4">District</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.map(u => (
                <tr key={u._id} className="hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-900">{u.name}<div className="text-xs text-gray-500 font-normal">{u.phone}</div></td>
                  <td className="p-4"><span className="px-2 py-1 bg-gray-100 text-xs font-bold rounded-lg uppercase">{u.role}</span></td>
                  <td className="p-4 text-sm text-gray-600">{u.location?.district || '-'}</td>
                  <td className="p-4">
                    {u.isVerified ? <span className="text-green-600 flex items-center gap-1 text-xs font-bold"><CheckCircle className="w-4 h-4"/> VERIFIED</span> : <span className="text-amber-500 flex items-center gap-1 text-xs font-bold"><XCircle className="w-4 h-4"/> PENDING</span>}
                  </td>
                  <td className="p-4 text-right">
                    <button onClick={() => toggleVerify(u._id, u.isVerified)} className="px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-100 font-bold text-xs rounded-lg transition-colors">
                      {u.isVerified ? 'Revoke Verif' : 'Verify UID'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
