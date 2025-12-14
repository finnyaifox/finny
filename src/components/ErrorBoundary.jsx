import React, { Component } from 'react';

export class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <div style={{ padding: '2rem', background: '#1a1a1a', color: '#ff5f5f', minHeight: '100vh', fontFamily: 'monospace' }}>
                    <h1>⚠️ Something went wrong.</h1>
                    <p>Please send this error to support:</p>
                    <pre style={{ background: '#333', padding: '1rem', borderRadius: '4px', overflow: 'auto' }}>
                        {this.state.error?.toString()}
                    </pre>
                    <details style={{ marginTop: '1rem' }}>
                        <summary>Stack Trace</summary>
                        <pre>{this.state.errorInfo?.componentStack}</pre>
                    </details>
                    <button
                        onClick={() => window.location.reload()}
                        style={{ marginTop: '1rem', padding: '0.5rem 1rem', cursor: 'pointer' }}
                    >
                        Reload Page
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}
