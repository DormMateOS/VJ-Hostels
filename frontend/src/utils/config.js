const config = {
  api: {
    baseUrl: import.meta.env.VITE_SERVER_URL || "http://localhost:6201",
    authUrl: import.meta.env.VITE_AUTH_URL || "http://localhost:6201/auth",
  }
};

export { config };