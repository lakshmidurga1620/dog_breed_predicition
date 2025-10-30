import React from 'react';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-gray-900 text-white mt-6">
      <div
        className="max-w-md w-full p-10 rounded-xl shadow-2xl bg-gray-800 text-center 
                   animate-fadeInDown transition-all duration-700 ease-out"
      >
        <div className="text-6xl mb-5 block" aria-hidden="true">
          🐾
        </div>

        <h1
          className="text-8xl font-extrabold text-orange-500 leading-none mb-2 
                     text-shadow-lg [text-shadow:2px_2px_4px_rgba(0,0,0,0.6)]"
        >
          404
        </h1>

        <h2 className="text-2xl font-semibold mb-6 text-purple-300">
          Page Not Found
        </h2>

        <p className="text-lg mb-10 leading-relaxed text-gray-300">
          It seems you've wandered off the trail. We can't find the page you're looking for, but don't worry, you can always head back to safety!
        </p>

        <Link
          to="/"
          className="inline-flex items-center bg-orange-500 text-gray-900 font-bold 
                     py-3 px-6 rounded-lg mr-4 transition-all duration-300 
                     hover:bg-orange-600 hover:shadow-xl hover:-translate-y-1 mb-4"
        >
          <span className="mr-2 text-xl">🏠</span> Return to Homepage
        </Link>

        <Link
          to="/breeds"
          className="inline-block text-orange-500 font-semibold py-3 px-4 rounded-lg 
                     border-2 border-orange-500 transition-all duration-300 
                     hover:bg-orange-500 hover:text-white mt-4 sm:mt-0"
        >
          Browse Breeds
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;
