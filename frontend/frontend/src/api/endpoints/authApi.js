const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

export const authApi = {
  register: async (data) => {
    await delay(800);
    const role = data.role || 'farmer';
    return {
      data: {
        token: 'mock-jwt-token',
        user: {
          _id: '123',
          name: data.name || data.fullName || 'Demo User',
          email: data.email || '',
          phone: data.phone || '9999999999',
          role,
          isVerified: true,
          location: { state: 'Maharashtra', district: 'Pune' }
        }
      }
    };
  },
  login: async (data) => {
    await delay(800);
    const identifier = (data.identifier || data.email || '').toLowerCase();
    let role = data.role || 'farmer';
    if (!data.role) {
      if (identifier.includes('admin')) role = 'admin';
      else if (identifier.includes('buyer')) role = 'buyer';
      else if (identifier.includes('transporter') || identifier.includes('driver')) role = 'transporter';
    }
    
    return { 
      data: { 
        token: 'mock-jwt-token', 
        user: { 
          _id: 'user123', 
          name: role.charAt(0).toUpperCase() + role.slice(1) + ' Demo', 
          email: identifier, 
          phone: '9999999999', 
          role: role, 
          isVerified: true, 
          location: { state: 'Maharashtra', district: 'Pune', village: 'Shivaji Nagar' }, 
          rating: 4.8,
          completedOrders: 24
        } 
      } 
    };
  },
  getMe: async () => {
    await delay(400);
    const userStr = localStorage.getItem('user');
    const user = userStr ? JSON.parse(userStr) : null;
    return { data: { data: user || { _id: 'user123', name: 'Demo User', role: 'farmer', isVerified: true, location: { district: 'Pune' } } } };
  },
  updateProfile: async (data) => {
    await delay(500);
    return { data: { ...data } };
  }
};
