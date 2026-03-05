import React, { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Loader2, Play } from 'lucide-react';
import { authApi } from '../services/api';

export function AuthView({ setToken }) {
    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: ''
    });

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
        setError(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            let response;
            if (isLogin) {
                response = await authApi.login({ email: formData.email, password: formData.password });
            } else {
                response = await authApi.register(formData);
            }

            // Backend returns { access_token, refresh_token, token_type }
            if (response && response.access_token) {
                localStorage.setItem('selftune_refresh_token', response.refresh_token);
                setToken(response.access_token);
            } else if (response && response.id) {
                // Register returns UserRead — auto-login after registration not needed,
                // prompt user to log in instead
                throw new Error("Account created! Please log in.");
            } else {
                throw new Error("Invalid response from server. No token received.");
            }
        } catch (err) {
            console.error("Authentication Error:", err);
            setError(err.response?.data?.message || err.message || "Failed to authenticate. Please check your credentials.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#0B0F19] text-slate-300 flex items-center justify-center p-6 font-sans relative overflow-hidden">
            {/* Background embellishments */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-lg h-[400px] bg-indigo-500/20 blur-[120px] rounded-full pointer-events-none" />

            <div className="w-full max-w-md relative z-10">
                {/* Logo and Header */}
                <div className="text-center mb-10 text-white">
                    <div className="inline-flex items-center justify-center p-3 bg-[#151B2B] rounded-2xl border border-slate-800 shadow-2xl mb-6">
                        <img src="/selftune.svg" alt="SelfTune Logo" className="w-12 h-12 drop-shadow-lg" />
                    </div>
                    <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome to SelfTune</h1>
                    <p className="text-slate-400">Your self-service LLM fine-tuning platform.</p>
                </div>

                {/* Main Card */}
                <div className="bg-[#151B2B] border border-slate-800 rounded-2xl p-8 shadow-2xl">
                    <div className="flex bg-[#0B0F19] p-1 rounded-lg mb-8">
                        <button
                            onClick={() => { setIsLogin(true); setError(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isLogin ? 'bg-[#151B2B] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => { setIsLogin(false); setError(null); }}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isLogin ? 'bg-[#151B2B] text-white shadow' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            Create Account
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-rose-900/20 border border-rose-900/50 text-rose-400 text-sm px-4 py-3 rounded-lg flex items-start gap-2">
                                <span>{error}</span>
                            </div>
                        )}

                        {!isLogin && (
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                                <div className="relative">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                    <input
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required={!isLogin}
                                        className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                        placeholder="John Doe"
                                    />
                                </div>
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email Address</label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="you@email.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-5 h-5" />
                                <input
                                    type="password"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required
                                    className="w-full bg-[#0B0F19] border border-slate-800 rounded-lg pl-11 pr-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition-colors"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center justify-center gap-2 w-full bg-indigo-600 hover:bg-indigo-700 text-white py-3 rounded-lg text-sm font-medium transition-colors mt-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    {isLogin ? 'Sign In' : 'Create Account'}
                                    <ArrowRight className="w-4 h-4" />
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
