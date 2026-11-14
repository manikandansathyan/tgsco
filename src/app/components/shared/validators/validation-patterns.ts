export const ValidationPatterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone: /^[6-9]\d{9}$/,
  name: /^[a-zA-Z\s.'-]+$/,
  positiveNumber: /^[0-9]+(\.[0-9]+)?$/,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  url: /^https?:\/\/.+/i,
};