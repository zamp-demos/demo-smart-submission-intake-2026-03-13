import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './components/DashboardLayout';
import ProcessList from './components/ProcessList';
import ProcessDetails from './components/ProcessDetails';
import KnowledgeBase from './components/KnowledgeBase';
import Login from './components/Login';
import People from './components/People';

const CATEGORY_SLUG = 'smart-submission-intake';
const CATEGORY_LABEL = 'Smart Submission Intake';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to={`/${CATEGORY_SLUG}`} replace />} />
        <Route path={`/${CATEGORY_SLUG}`} element={<DashboardLayout />}>
          <Route index element={<ProcessList categorySlug={CATEGORY_SLUG} categoryLabel={CATEGORY_LABEL} />} />
          <Route path="process/:processId" element={<ProcessDetails categorySlug={CATEGORY_SLUG} />} />
          <Route path="knowledge-base" element={<KnowledgeBase />} />
          <Route path="people" element={<People />} />
        </Route>
        <Route path="*" element={<Navigate to={`/${CATEGORY_SLUG}`} replace />} />
      </Routes>
    </Router>
  );
}

export default App;
