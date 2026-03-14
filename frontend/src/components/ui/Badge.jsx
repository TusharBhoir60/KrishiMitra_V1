export const Badge = ({ type, value }) => {
  const getBadgeStyle = () => {
    if (type === 'status') {
      const v = value.toLowerCase();
      if (['pending', 'declined', 'disputed'].includes(v)) return 'bg-amber-100 text-amber-800';
      if (['accepted', 'scheduled', 'in_transit'].includes(v)) return 'bg-blue-100 text-blue-800';
      if (v === 'delivered') return 'bg-teal-100 text-teal-800';
      if (v === 'completed') return 'bg-green-100 text-green-800';
      if (['expired', 'cancelled'].includes(v)) return 'bg-gray-100 text-gray-600';
      return 'bg-gray-100 text-gray-800';
    }
    if (type === 'grade') {
      if (value === 'A') return 'bg-green-100 text-green-800 ring-1 ring-green-400';
      if (value === 'B') return 'bg-blue-100 text-blue-800 ring-1 ring-blue-400';
      return 'bg-amber-100 text-amber-800 ring-1 ring-amber-400';
    }
    if (type === 'perishability') {
      const v = value.toLowerCase();
      if (v === 'high') return 'bg-red-100 text-red-800 ring-1 ring-red-400';
      if (v === 'medium') return 'bg-amber-100 text-amber-800 ring-1 ring-amber-400';
      if (v === 'low') return 'bg-green-100 text-green-800 ring-1 ring-green-400';
    }
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-body font-medium ${getBadgeStyle()}`}>
      {value}
    </span>
  );
};
