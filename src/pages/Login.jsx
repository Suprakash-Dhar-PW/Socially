
import React from 'react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="bg-white p-8 rounded-2xl shadow-lg text-center max-w-sm w-full">
        <h1 className="text-2xl font-bold mb-4 text-blue-600">WeShare</h1>
        <p className="text-gray-600 mb-8">Welcome back! Please login to continue.</p>
        <button 
          onClick={() => navigate('/feed')}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors"
        >
          Login to Dashboard
        </button>
      </div>
    </div>
  );
};

export default Login;
