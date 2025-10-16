import { useEffect, useState } from 'react';
import useCurrentUser from '../../hooks/student/useCurrentUser';

const DebugAuth = () => {
    const [tokenInfo, setTokenInfo] = useState(null);
    const { user, loading, error, isAuthenticated } = useCurrentUser();

    useEffect(() => {
        const token = localStorage.getItem('token');

        // Check for token in cookies
        const cookies = document.cookie.split(';');
        const tokenCookie = cookies.find(cookie => cookie.trim().startsWith('token='));
        const cookieToken = tokenCookie ? tokenCookie.split('=')[1] : null;

        setTokenInfo({
            hasToken: !!token,
            tokenLength: token ? token.length : 0,
            tokenPreview: token ? `${token.substring(0, 20)}...` : 'No token',
            hasCookieToken: !!cookieToken,
            cookieTokenLength: cookieToken ? cookieToken.length : 0,
            cookieTokenPreview: cookieToken ? `${cookieToken.substring(0, 20)}...` : 'No cookie token',
            allCookies: document.cookie || 'No cookies'
        });
    }, []);

    return (
        <div style={{ 
            position: 'fixed', 
            top: '10px', 
            right: '10px', 
            background: 'white', 
            border: '1px solid #ccc', 
            padding: '10px',
            fontSize: '12px',
            zIndex: 9999,
            maxWidth: '300px'
        }}>
            <h4>Auth Debug Info</h4>
            <div><strong>Token Info:</strong></div>
            <div>Has Token (localStorage): {tokenInfo?.hasToken ? 'Yes' : 'No'}</div>
            <div>Token Length: {tokenInfo?.tokenLength}</div>
            <div>Token Preview: {tokenInfo?.tokenPreview}</div>

            <div style={{ marginTop: '5px' }}><strong>Cookie Info:</strong></div>
            <div>Has Cookie Token: {tokenInfo?.hasCookieToken ? 'Yes' : 'No'}</div>
            <div>Cookie Token Length: {tokenInfo?.cookieTokenLength}</div>
            <div>Cookie Token Preview: {tokenInfo?.cookieTokenPreview}</div>
            <div style={{ fontSize: '10px', wordBreak: 'break-all' }}>All Cookies: {tokenInfo?.allCookies}</div>
            
            <div style={{ marginTop: '10px' }}><strong>Hook State:</strong></div>
            <div>Loading: {loading ? 'Yes' : 'No'}</div>
            <div>Is Authenticated: {isAuthenticated ? 'Yes' : 'No'}</div>
            <div>Has User: {user ? 'Yes' : 'No'}</div>
            <div>Error: {error || 'None'}</div>
            
            {user && (
                <div style={{ marginTop: '10px' }}>
                    <strong>User Info:</strong>
                    <div>Name: {user.name}</div>
                    <div>Roll: {user.rollNumber}</div>
                    <div>Email: {user.email}</div>
                </div>
            )}
            
            <button 
                onClick={() => {
                    localStorage.removeItem('token');
                    window.location.reload();
                }}
                style={{ marginTop: '10px', fontSize: '10px' }}
            >
                Clear Token & Reload
            </button>
        </div>
    );
};

export default DebugAuth;
