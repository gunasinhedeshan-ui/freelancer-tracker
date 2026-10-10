export const getErrorMessage = (err) => {
  const data = err.response?.data;
  if (data?.errors?.length) return data.errors.map((e) => e.msg).join(', ');
  if (data?.message) return data.message;
  if (err.request) return 'Cannot reach the server. Please try again.';
  return 'Something went wrong';
};