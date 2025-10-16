import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Error caught by boundary:', error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ 
                    padding: '20px', 
                    textAlign: 'center',
                    backgroundColor: '#ffebee',
                    borderRadius: '8px',
                    margin: '20px'
                }}>
                    <h2>Something went wrong</h2>
                    <p style={{ color: '#d32f2f' }}>{this.state.error?.message || 'An error occurred'}</p>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;