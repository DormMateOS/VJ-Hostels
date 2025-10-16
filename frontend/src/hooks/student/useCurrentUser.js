import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';

// Cache for user data to avoid unnecessary API calls
let userCache = null;
let cacheTimestamp = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const useCurrentUser = (options = {}) => {
    const {
        enableCache = true,
        refetchOnMount = false,
        onError = null
    } = options;

    const [user, setUser] = useState(userCache);
    const [loading, setLoading] = useState(!userCache);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);

    const fetchCurrentUser = useCallback(async (forceRefresh = false) => {
        let token = localStorage.getItem('token');

        // Check for token in cookies as fallback (for existing Google OAuth users)
        if (!token) {
            const cookies = document.cookie.split(';');
            const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
            if (tokenCookie) {
                token = tokenCookie.split('=')[1];
                console.log('useCurrentUser: Found token in cookie, migrating to localStorage');
                localStorage.setItem('token', token);
            }
        }

        console.log('useCurrentUser: fetchCurrentUser called, token:', token ? 'exists' : 'not found');

        if (!token) {
            console.log('useCurrentUser: No token found in localStorage or cookies, setting user to null');
            setUser(null);
            setLoading(false);
            setError(null);
            userCache = null;
            cacheTimestamp = null;
            return;
        }

        // Check cache if enabled and not forcing refresh
        if (enableCache && !forceRefresh && userCache && cacheTimestamp) {
            const now = Date.now();
            if (now - cacheTimestamp < CACHE_DURATION) {
                setUser(userCache);
                setLoading(false);
                setError(null);
                return;
            }
        }

        // Cancel previous request if it exists
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }

        // Create new abort controller for this request
        abortControllerRef.current = new AbortController();

        try {
            setLoading(true);
            setError(null);

            console.log('useCurrentUser: Making API call to fetch user data');

            const response = await axios.get(
                `${import.meta.env.VITE_SERVER_URL}/student-api/profile`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    },
                    signal: abortControllerRef.current.signal
                }
            );

            const userData = response.data;
            console.log('useCurrentUser: User data received:', userData);
            setUser(userData);

            // Update cache
            if (enableCache) {
                userCache = userData;
                cacheTimestamp = Date.now();
            }
        } catch (err) {
            // Don't handle aborted requests
            if (err.name === 'AbortError' || err.code === 'ERR_CANCELED') {
                return;
            }

            console.error('Error fetching current user:', err);

            const errorMessage = err.response?.data?.message || 'Failed to fetch user data';

            // If token is invalid, clear it
            if (err.response?.status === 401) {
                localStorage.removeItem('token');
                setUser(null);
                userCache = null;
                cacheTimestamp = null;
                setError('Session expired. Please login again.');
            } else {
                setError(errorMessage);
            }

            // Call custom error handler if provided
            if (onError) {
                onError(err);
            }
        } finally {
            setLoading(false);
            abortControllerRef.current = null;
        }
    }, [enableCache, onError]);

    // Fetch user data on mount and when token changes
    useEffect(() => {
        if (refetchOnMount || !userCache) {
            fetchCurrentUser();
        }
    }, [fetchCurrentUser, refetchOnMount]);

    // Cleanup abort controller on unmount
    useEffect(() => {
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
        };
    }, []);

    // Function to refresh user data manually
    const refreshUser = useCallback((forceRefresh = true) => {
        fetchCurrentUser(forceRefresh);
    }, [fetchCurrentUser]);

    // Function to clear user data (for logout)
    const clearUser = useCallback(() => {
        setUser(null);
        setError(null);
        setLoading(false);
        localStorage.removeItem('token');
        userCache = null;
        cacheTimestamp = null;

        // Cancel any ongoing request
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
    }, []);

    // Function to update user data locally (useful after profile updates)
    const updateUser = useCallback((updatedUserData) => {
        setUser(updatedUserData);
        if (enableCache) {
            userCache = updatedUserData;
            cacheTimestamp = Date.now();
        }
    }, [enableCache]);

    return {
        user,
        loading,
        error,
        refreshUser,
        clearUser,
        updateUser,
        isAuthenticated: !!user && !!localStorage.getItem('token'),
        isCached: !!userCache
    };
};

export default useCurrentUser;
