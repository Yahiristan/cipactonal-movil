export const getApiEndpoint = (path = '') => {
  const BASE_URL = 'https://backend-production-0087.up.railway.app';

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

export default getApiEndpoint;