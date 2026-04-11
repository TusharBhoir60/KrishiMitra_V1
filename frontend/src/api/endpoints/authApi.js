import api from '../axiosConfig';

export const authApi = {
  register: async (data) => {
    const {
      fullName,
      district,
      state = 'Maharashtra',
      confirmPassword: _confirmPassword,
      companyName,
      serviceAreas,
      maxLoadCapacity,
      ...rest
    } = data;

    const normalizedZones = typeof serviceAreas === 'string'
      ? serviceAreas.split(',').map((area) => area.trim()).filter(Boolean)
      : [];

    await api.post('/auth/register', {
      ...rest,
      name: fullName,
      businessName: companyName,
      zones: normalizedZones,
      capacityKg: maxLoadCapacity ? Number(maxLoadCapacity) : undefined,
      location: { district, state },
    });

    // Backend registration does not issue tokens, so perform login next.
    const loginRes = await api.post('/auth/login', {
      email: data.email,
      password: data.password,
    });

    const { user, accessToken } = loginRes.data.data;
    return { data: { user, token: accessToken } };
  },
  login: async (data) => {
    const res = await api.post('/auth/login', data);
    const { user, accessToken } = res.data.data;
    return { data: { user, token: accessToken } };
  },
  getMe: async () => {
    const res = await api.get('/auth/me');
    return { data: res.data.data };
  },
  updateProfile: async (data) => {
    const res = await api.patch('/auth/me', data);
    return { data: res.data.data };
  },
};