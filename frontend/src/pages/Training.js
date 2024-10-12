import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { UserContext } from '../contexts/UserContext';
import '../styles/Home.css';

const Training = () => {
  const [audits, setAudits] = useState([]);
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState(['upcoming', 'live']);
  const [difficulties, setDifficulties] = useState([]);
  const [sortCriteria, setSortCriteria] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { username, handleLogin } = useContext(UserContext);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const response = await fetch('https://codecallbackend.vercel.app/training');
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setAudits(data);
      } catch (error) {
        console.error('Error fetching competitions:', error);
      }
    };

    fetchAudits();
  }, []);

  const handleViewClick = (id) => {
    navigate(`/training/${id}`);
  };

  const handleProgrammingLanguageChange = (language) => {
    setProgrammingLanguages((prev) =>
      prev.includes(language)
        ? prev.filter((item) => item !== language)
        : [...prev, language]
    );
  };

  const handleTypeChange = (type) => {
    setTypes((prev) =>
      prev.includes(type) ? prev.filter((item) => item !== type) : [...prev, type]
    );
  };

  const handleStatusChange = (status) => {
    setStatuses((prev) =>
      prev.includes(status)
        ? prev.filter((item) => item !== status)
        : [...prev, status]
    );
  };

  const handleDifficultyChange = (difficulty) => {
    setDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((item) => item !== difficulty)
        : [...prev, difficulty]
    );
  };

  const handleSortChange = (criteria) => {
    if (sortCriteria.includes(criteria)) {
      setSortCriteria([]);
    } else {
      setSortCriteria([criteria]);
    }
  };
  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value);
  };

  const getRemainingTime = (status, targetDate, startDate) => {
    const now = new Date();
    let target = new Date(targetDate);

    if (status.toLowerCase() === 'upcoming') {
      target = new Date(startDate);
    } else if (status.toLowerCase() === 'judging') {
      target.setDate(target.getDate() + 14); 
    }

    const difference = target - now;
    if (difference <= 0) {
      return 'Ended';
    } else {
      const days = Math.floor(difference / (1000 * 60 * 60 * 24));
      const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
      const minutes = Math.floor((difference / (1000 * 60)) % 60);
      return `${days}D ${hours}H ${minutes}M`;
    }
  };

  const filteredAudits = audits.filter(audit => {
    const languageMatch = programmingLanguages.length === 0 || programmingLanguages.some(lang => audit.languages.includes(lang));
    const typeMatch = types.length === 0 || types.some(type => audit.types.includes(type));
    const statusMatch = statuses.length === 0 || statuses.includes(audit.status.toLowerCase());
    const difficultyMatch = difficulties.length === 0 || difficulties.includes(audit.difficulty);
    const searchMatch = audit.name.toLowerCase().includes(searchTerm.toLowerCase()) || audit.description.toLowerCase().includes(searchTerm.toLowerCase());
    return languageMatch && typeMatch && statusMatch && difficultyMatch && searchMatch;
  });

  const sortAudits = (audits, sortCriteria) => {
    if (sortCriteria.length === 0) {
      return audits;
    }

    const sortedAudits = [...audits];

    if (sortCriteria.includes('largest prize pool')) {
      sortedAudits.sort((a, b) => b.reward - a.reward);
    } else if (sortCriteria.includes('smallest prize pool')) {
      sortedAudits.sort((a, b) => a.reward - b.reward);
    } else if (sortCriteria.includes('difficulty')) {
      sortedAudits.sort((a, b) => a.difficulty.localeCompare(b.difficulty));
    }

    return sortedAudits;
  };

  const sortedAudits = sortAudits(filteredAudits, sortCriteria);

  useEffect(() => {
    const interval = setInterval(() => {
      setAudits([...audits]);
    }, 1000);

    return () => clearInterval(interval);
  }, [audits]);

  const calculateRewards = (reward) => {
    const feature = reward * 0.5;
    const optimization = reward * 0.1;
    const judging = reward * 0.2;
    const bugs = reward * 0.2;

    return { feature, optimization, judging, bugs };
  };

  return (
    <div className="home">
      <div className="container">
        <h1 className="title">Training</h1>
        <div className="filters">
          <div className="dropdown">
            <button className="dropbtn">Programming Language</button>
            <div className="dropdown-content">
              <label>
                <input
                  type="checkbox"
                  value="JavaScript"
                  onChange={() => handleProgrammingLanguageChange('JavaScript')}
                  checked={programmingLanguages.includes('JavaScript')}
                />
                JavaScript
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Python"
                  onChange={() => handleProgrammingLanguageChange('Python')}
                  checked={programmingLanguages.includes('Python')}
                />
                Python
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Java"
                  onChange={() => handleProgrammingLanguageChange('Java')}
                  checked={programmingLanguages.includes('Java')}
                />
                Java
              </label>
            </div>
          </div>
          <div className="dropdown">
            <button className="dropbtn">Type</button>
            <div className="dropdown-content">
              <label>
                <input
                  type="checkbox"
                  value="Feature Development"
                  onChange={() => handleTypeChange('Feature Development')}
                  checked={types.includes('Feature Development')}
                />
                Feature
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Security"
                  onChange={() => handleTypeChange('Security')}
                  checked={types.includes('Security')}
                />
                Security
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Optimization"
                  onChange={() => handleTypeChange('Optimization')}
                  checked={types.includes('Optimization')}
                />
                Optimization
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Algorithms"
                  onChange={() => handleTypeChange('Algorithms')}
                  checked={types.includes('Algorithms')}
                />
                Algorithms
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Trading"
                  onChange={() => handleTypeChange('Trading')}
                  checked={types.includes('Trading')}
                />
                Trading
              </label>
            </div>
          </div>
          <div className="dropdown">
           
          
          </div>
          <div className="dropdown">
            <button className="dropbtn">Difficulty</button>
            <div className="dropdown-content">
              <label>
                <input
                  type="checkbox"
                  value="Beginner"
                  onChange={() => handleDifficultyChange('Beginner')}
                  checked={difficulties.includes('Beginner')}
                />
                Beginner
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Intermediate"
                  onChange={() => handleDifficultyChange('Intermediate')}
                  checked={difficulties.includes('Intermediate')}
                />
                Intermediate
              </label>
              <label>
                <input
                  type="checkbox"
                  value="Advanced"
                  onChange={() => handleDifficultyChange('Advanced')}
                  checked={difficulties.includes('Advanced')}
                />
                Advanced
              </label>
            </div>
          </div>
          <div className="dropdown">
            <button className="dropbtn">Sort</button>
            <div className="dropdown-content">
              <label>
                <input
                  type="checkbox"
                  value="largest prize pool"
                  onChange={() => handleSortChange('largest prize pool')}
                  checked={sortCriteria.includes('largest prize pool')}
                />
                Largest Pool
              </label>
              <label>
                <input
                  type="checkbox"
                  value="smallest prize pool"
                  onChange={() => handleSortChange('smallest prize pool')}
                  checked={sortCriteria.includes('smallest prize pool')}
                />
                Smallest Pool
              </label>
     
            </div>
          </div>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search Trainings..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="content">
          <div className="audits-list">
            {sortedAudits.map((audit) => {
              const rewards = calculateRewards(audit.reward);
              return (
                <div className="audit-card" key={audit._id}>
                  <div className={`audit-info ${audit.status.toLowerCase()}`}>
                    <div className="audit-price-container">
                      <div className="audit-price">
                        <span>{audit.points} XP</span>
                        <FaInfoCircle className="info-icon" />
                        <div className="info-tooltip">
                          <strong>Rewards for this contest comprise a pool broken down into the following categories:</strong>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div> {Math.round(audit.points * 0.5)} XP Feature</div>
                            <div>{Math.round(audit.points * 0.1)} XP Optimization</div>
                            <div>{Math.round(audit.points * 0.2)} XP Judging</div>
                            <div>{Math.round(audit.points * 0.2)} XP Bugs</div>
                          </div>
                        </div>
                      </div>
                    </div>
           
                  </div>
                  <div className="audit-main">
                    <div className="audit-header">
                      <div className="audit-image">
                        <img src={audit.image} alt={audit.name} loading="lazy"/>
                      </div>
                      <h2>{audit.name}</h2>
                      <div className="audit-tags">
                        {audit.languages.map(lang => <span key={lang} className={lang}>{lang}</span>)}
                        {audit.types.map(type => <span key={type} className={type.replace(/\s/g, '')}>{type}</span>)}
                        <span className={`tag difficulty ${audit.difficulty.toLowerCase()}`}>{audit.difficulty}</span>
                      </div>
                    </div>
                    <div className="audit-description">
                      <span>{audit.description}</span>
                    </div>
                  </div>
                  <div className="view-icon-container">
                    <ChevronRightIcon onClick={() => handleViewClick(audit._id)} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="side-info">
            <div className="info-card">
              <h3>Learn</h3>
              <p>Courses created by software engineers to help you hone your skills and become the best software engineer you can be.</p>
              {username ? (
                <button className="styled-button">Welcome {username}</button>
              ) : (
                <button className="styled-button" onClick={handleLogin}>
                  Connect GitHub
                </button>
              )}
            </div>
            <div className="info-card">
              <h3>For Businesses</h3>
              <p>Utilize our training Projects to train your employees in various technologies, unlike other platforms..ours is free!</p>
              <button className="styled-button" onClick={() => window.location.href='https://www.codecall.xyz/contact#contact'}>List Project</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Training;
