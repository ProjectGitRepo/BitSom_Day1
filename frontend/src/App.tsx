import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "./components/Layout";
import Dashboard from "./pages/Dashboard";
import TalentDirectory from "./pages/TalentDirectory";
import CapabilitySearch from "./pages/CapabilitySearch";
import WorkforcePlanner from "./pages/WorkforcePlanner";
import SkillGapPage from "./pages/SkillGapPage";
import SystemConfig from "./pages/SystemConfig";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/talent" element={<TalentDirectory />} />
          <Route path="/talent/:employeeId/skill-gap" element={<SkillGapPage />} />
          <Route path="/capability-search" element={<CapabilitySearch />} />
          <Route path="/workforce-planner" element={<WorkforcePlanner />} />
          <Route path="/settings" element={<SystemConfig />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
