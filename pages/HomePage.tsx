import React from 'react';
import Dashboard from '../components/Dashboard';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-12">
      <Dashboard />
      <h2 className="text-center text-2xl font-bold">This is a placeholder HomePage.</h2>
      <p className="text-center text-gray-500">It is not currently linked in the navigation.</p>
    </div>
  );
};

export default HomePage;
