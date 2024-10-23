import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import Home from './pages/Home';
import Training from './pages/Training';
import Judging from './pages/Judging';
import Profile from './pages/Profile2';
import EditProfile from './pages/EditProfile';
import Leaderboard from './pages/Leaderboard';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AddCompetition from './pages/AddCompetition';
import CompetitionDetails from './pages/CompetitionDetails';
import TrainingDetails from './pages/TrainingDetails';
import NavBar from './components/NavBar';
import './App.css';
import { UserProvider } from './contexts/UserContext';
import { MoonPayProvider } from '@moonpay/moonpay-react';

function App() {
  return (
    <Router>
      <UserProvider>
        {/* <MoonPayProvider apiKey={process.env.REACT_APP_MOONPAY_PUBLIC_KEY} debug> */}
        <div className="App">
          <NavBar />
          <div className="App-content">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/training" element={<Training />} />
              <Route path="/judging" element={<Judging />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile/:username" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/edit-profile/:username" element={<EditProfile />} />
              <Route path="/competition/:id" element={<CompetitionDetails />} />
              <Route path="/training/:id" element={<TrainingDetails />} />
              <Route path="/auth" element={<AuthPage />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/add-competition" element={<AddCompetition />} />
            </Routes>
          </div>
        </div>
        {/* </MoonPayProvider> */}
      </UserProvider>
    </Router>
  );
}
export default App;
