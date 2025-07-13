import React, { useState } from 'react';
import { EnvelopeIcon, LockClosedIcon, ArrowRightIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';
import schoolIllustration from '../assets/school-illustration.svg';
import 'react-toastify/dist/ReactToastify.css';
import { useAuth } from '../context/authContext';

export default function Login() {
  const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
      email: '',
      password: ''
    });
    const [formErrors, setFormErrors] = useState({});
    const { login, error } = useAuth();

    const validateForm = () => {
      const errors = {};
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!formData.email.trim()) {
        errors.email = 'Email is required';
      } else if (!emailRegex.test(formData.email)) {
        errors.email = 'Invalid email format';
      }

      if (!formData.password) {
        errors.password = 'Password is required';
      }

      setFormErrors(errors);
      return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!validateForm()) return;
      setLoading(true);
      await login(formData);
      };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-500 flex flex-col md:flex-row p-4 md:p-8">
      {/* Illustration Section */}
      <div className="flex-1 flex items-center justify-center p-8 rounded-2xl bg-white/20 backdrop-blur-sm">
        <div className="max-w-md text-center">
          <img
            src={schoolIllustration}
            alt="School Illustration"
            className="w-full h-auto max-h-64 mx-auto"
            loading="lazy"
          />
          <h3 className="text-xl font-semibold text-blue-600 mt-6">Welcome to SchoolSync</h3>
          <p className="text-gray-500 mt-2">Modern school management solution</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-[50rem] md:w-[30rem] bg-white rounded-2xl shadow-xl overflow-hidden mt-4 md:mt-0 md:ml-8">
        <div className="p-8 md:p-20">
          <div className="text-center mb-8">
            <p className="text-gray-500 mt-2">
              Enter your credentials to access your account
            </p>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg flex items-center">
              <ExclamationCircleIcon className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={(e) => handleSubmit(e)} className="space-y-10">
            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <EnvelopeIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, email: e.target.value }));
                    if (formErrors.email) setFormErrors(prev => ({ ...prev, email: '' }));
                  }}
                  className={`block w-full text-black pl-10 pr-3 py-3 border-b ${
                    formErrors.email ? 'border-b-red-300' : 'border-b-gray-300'
                  } rounded-lg focus:border-b-blue-500 focus:border-blue-500`}
                  placeholder="your@email.com"
                />
              </div>
              {formErrors.email && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formErrors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
              </div>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  value={formData.password}
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  onChange={(e) => {
                    setFormData(prev => ({ ...prev, password: e.target.value }));
                    if (formErrors.password) setFormErrors(prev => ({ ...prev, password: '' }));
                  }}
                  className={`block text-black w-full pl-10 pr-10 py-3 border ${
                    formErrors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:ring-blue-500 focus:border-blue-500`}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  )}
                </button>
              </div>
              {formErrors.password && (
                <p className="mt-1 text-sm text-red-600 flex items-center">
                  <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                  {formErrors.password}
                </p>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex items-center justify-between">
              <button
                type="submit"
                disabled={loading}
                className="flex items-center justify-center bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white font-medium py-2 px-6 rounded-lg transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none"
              >
                {loading ? (
                  <>
                    <ArrowRightIcon className="animate-spin h-5 w-5 mr-2" />
                    Authenticating...
                  </>
                ) : (
                  <>
                    Log in <ArrowRightIcon className="h-4 w-4 ml-2" />
                  </>
                )}
              </button>
            </div>

            {/* Footer Links */}
            <div className="text-center text-xs text-gray-500 mt-6">
              <p>
                By continuing, you agree to our{' '}
                <a href="/terms" className="text-blue-600 hover:text-blue-500">Terms</a> and{' '}
                <a href="/privacy" className="text-blue-600 hover:text-blue-500">Privacy Policy</a>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}