import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 py-2 sm:py-3 mt-4 sm:mt-6">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm sm:text-base text-gray-600">
            Made with{' '}
            <span className="text-red-500 text-base sm:text-lg">❤️</span>{' '}
            by{' '}
            <span className="font-semibold text-purple-600"><a href="https://abhijiths.online/" target="_blank" rel="noopener noreferrer">Abhijith S</a></span>
          </p>
        </div>
      </div>
    </footer>
  );
};
