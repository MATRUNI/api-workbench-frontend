export const getDefaultErrorMessage = (status) => {
  if (status >= 400 && status < 500) {
    return "Client Error: Please check your request";
  }
  if (status >= 500) {
    return "Server Error: Try again later";
  }
  return "Unexpected Error";
};