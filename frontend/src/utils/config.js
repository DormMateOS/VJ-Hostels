const config = {
  api: {
    baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3000",
    authUrl: import.meta.env.VITE_AUTH_URL || "http://localhost:3000/auth",
  }
};

export { config };