import { Outlet } from 'react-router-dom';
import Navbar from '../common/Navbar';

const LearnerLayout = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main>
        <Outlet />
      </main>
    </div>
  );
};

export default LearnerLayout;