export const getApiEndpoint = (path = '') => {
  const BASE_URL =
    process.env.EXPO_PUBLIC_API_URL ||
    'https://backend-production-0087.up.railway.app'; // fallback local

  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_URL}${cleanPath}`;
};

export default getApiEndpoint;