import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

export class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error("React Error Boundary Caught:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen bg-[#0B0F19] text-slate-300 flex items-center justify-center p-6 font-sans">
                    <div className="bg-[#151B2B] border border-rose-900/50 rounded-xl p-8 max-w-md w-full text-center shadow-2xl">
                        <div className="w-16 h-16 bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="w-8 h-8 text-rose-500" />
                        </div>
                        <h1 className="text-xl font-bold text-white mb-2">Something went wrong</h1>
                        <p className="text-sm text-slate-400 mb-6">
                            The application encountered an unexpected error. Please try reloading the page.
                        </p>

                        <button
                            onClick={() => window.location.reload()}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 w-full"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Reload Application
                        </button>
                    </div>
                </div>
            );
        }

        return this.props.children;
    }
}
