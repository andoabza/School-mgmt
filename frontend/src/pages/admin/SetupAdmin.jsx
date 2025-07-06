import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { 
  LockClosedIcon,
  UserIcon,
  MailIcon,
  KeyIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/outline';
import schoolIllustration from '../../assets/school-illustration.svg';
import api from '../../axiosConfig';

export default function AdminSetup() {
  const [loading, setLoading] = useState(false);
  const [setupComplete, setSetupComplete] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState([]);
  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const validatePassword = (value) => {
    const errors = [];
    if (value.length < 8) errors.push('At least 8 characters');
    if (!/[A-Z]/.test(value)) errors.push('At least one uppercase letter');
    if (!/[a-z]/.test(value)) errors.push('At least one lowercase letter');
    if (!/[0-9]/.test(value)) errors.push('At least one number');
    if (!/[^A-Za-z0-9]/.test(value)) errors.push('At least one special character');
    setPasswordErrors(errors);
    return errors.length === 0;
  };

  const onSubmit = async (data) => {
    setLoading(true);
    try {
      const response = await api.post('/setup-admin', data);
      if (response.data.token) {
        localStorage.setItem('admin_setup_token', response.data.token);
        setSetupComplete(true);
      }
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.error || 'Setup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (setupComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 text-center">
          <CheckCircleIcon className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Setup Complete!</h2>
          <p className="text-gray-600 mb-6">Admin account created successfully.</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 transform hover:-translate-y-1 hover:shadow-md"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col md:flex-row p-4">
      {/* Illustration Section - Hidden on mobile */}
      <div className="hidden md:flex flex-1 items-center justify-center p-8">
        <div className="max-w-md text-center">
          <img 
            src={schoolIllustration} 
            alt="School Illustration" 
            className="w-full h-auto max-h-64 mx-auto"
          />
          <h3 className="text-xl font-semibold text-blue-600 mt-6">Initial Admin Setup</h3>
          <p className="text-gray-500 mt-2">Create the first administrator account</p>
        </div>
      </div>

      {/* Form Section */}
      <div className="w-full md:w-96 bg-white rounded-xl shadow-xl overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-800">Admin Account Setup</h2>
            <p className="text-gray-500 mt-2">Configure your initial administrator credentials</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Setup Key */}
            <div>
              <label htmlFor="setupKey" className="block text-sm font-medium text-gray-700 mb-1">
                Setup Key
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <KeyIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="setupKey"
                  type="password"
                  {...register("setupKey", { required: "Setup key is required" })}
                  className="block w-full pl-10 pr-3 py-3 border text-black border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter setup key"
                />
              </div>
              {errors.setupKey && (
                <p className="mt-1 text-sm text-red-600">{errors.setupKey.message}</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MailIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="email"
                  type="email"
                  {...register("email", { 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  })}
                  className="block w-full pl-10 pr-3 text-black py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@yourschool.edu"
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Name Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                  First Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="firstName"
                    {...register("firstName", { required: "First name is required" })}
                    className="block w-full text-black pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="First name"
                  />
                </div>
                {errors.firstName && (
                  <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                  Last Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <UserIcon className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="lastName"
                    {...register("lastName", { required: "Last name is required" })}
                    className="text-black block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Last name"
                  />
                </div>
                {errors.lastName && (
                  <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                )}
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="password"
                  type="password"
                  {...register("password", { 
                    required: "Password is required",
                    validate: validatePassword
                  })}
                  onChange={(e) => validatePassword(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 text-black"
                  placeholder="Create a password"
                />
              </div>
              <div className="mt-2">
                {passwordErrors.length > 0 ? (
                  <ul className="text-sm text-red-600 space-y-1">
                    {passwordErrors.map((error, index) => (
                      <li key={index} className="flex items-center">
                        <ExclamationCircleIcon className="h-4 w-4 mr-1" />
                        {error}
                      </li>
                    ))}
                  </ul>
                ) : watch("password")?.length > 0 && (
                  <p className="text-sm text-green-600 flex items-center">
                    <CheckCircleIcon className="h-4 w-4 mr-1" />
                    Password meets all requirements
                  </p>
                )}
              </div>
            </div>

            {/* Confirm Password */}
            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <LockClosedIcon className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  id="confirmPassword"
                  type="password"
                  {...register("confirmPassword", { 
                    required: "Please confirm your password",
                    validate: value => 
                      value === watch('password') || "Passwords don't match"
                  })}
                  className="text-black block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Confirm password"
                />
              </div>
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition duration-200 transform hover:-translate-y-1 hover:shadow-md disabled:opacity-70 disabled:transform-none disabled:hover:shadow-none"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Creating Admin Account...
                </span>
              ) : 'Complete Setup'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}