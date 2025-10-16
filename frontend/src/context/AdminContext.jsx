import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext(null);

export const AdminProvider = ({ children }) => {
    const [admin, setAdmin] = useState(() => {
        const storedAdmin = localStorage.getItem('admin');
        return storedAdmin ? JSON.parse(storedAdmin) : null;
    });
    
    const [token, setToken] = useState(() => {
        return localStorage.getItem('adminToken') || null;
    });

    const login = (adminData, authToken) => {
        setAdmin(adminData);
        setToken(authToken);
        localStorage.setItem('admin', JSON.stringify(adminData));
        localStorage.setItem('adminToken', authToken);
    };

    const logout = () => {
        setAdmin(null);
        setToken(null);
        localStorage.removeItem('admin');
        localStorage.removeItem('adminToken');
    };

    const isAuthenticated = () => {
        return !!token;
    };

    return (
        <AdminContext.Provider value={{ admin, token, login, logout, isAuthenticated }}>
            {children}
        </AdminContext.Provider>
    );
};

export const useAdmin = () => {
    const context = useContext(AdminContext);
    if (context === null) {
        throw new Error('useAdmin must be used within an AdminProvider');
    }
    return context;
};
