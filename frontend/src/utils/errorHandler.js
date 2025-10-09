import toast from "react-hot-toast";

export const handleError = (error) => {
  let message = "An unexpected error occurred";
  
  if (error.response) {
    // Server responded with error status
    message = error.response.data?.message || 
              error.response.data?.error || 
              `Server error: ${error.response.status}`;
  } else if (error.request) {
    // Request made but no response
    message = "Network error - please check your connection";
  } else {
    // Other error
    message = error.message || "Something went wrong";
  }
  
  toast.error(message);
  return message;
};

export const handleSuccess = (message) => {
  toast.success(message);
  return message;
};