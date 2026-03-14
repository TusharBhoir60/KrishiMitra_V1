import { useState, useEffect } from 'react';
import { deliveryApi } from '../api/endpoints/deliveryApi';
import { useAuth } from './useAuth';

export const useDeliveryEstimate = ({ fromDistrict, quantity, perishability }) => {
  const { user } = useAuth();
  const buyerDistrict = user?.district;
  const [estimate, setEstimate] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!fromDistrict || !buyerDistrict || !quantity) return;

    const fetchEstimate = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await deliveryApi.getEstimate({
          fromDistrict,
          toDistrict: buyerDistrict,
          quantity,
          perishability
        });
        setEstimate(response.data);
      } catch (err) {
        setError(err.message || 'Failed to get delivery estimate');
        setEstimate(null);
      } finally {
        setLoading(false);
      }
    };

    const debounceId = setTimeout(() => {
      fetchEstimate();
    }, 500);

    return () => clearTimeout(debounceId);
  }, [fromDistrict, buyerDistrict, quantity, perishability]);

  return { estimate, loading, error };
};
