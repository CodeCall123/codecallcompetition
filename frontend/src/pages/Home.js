import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaInfoCircle } from 'react-icons/fa';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import usdcIcon from '../assets/images/usdc.png';
import { UserContext } from '../contexts/UserContext';
import '../styles/Home.css';

const Home = () => {
  const [audits, setAudits] = useState([]);
  const [programmingLanguages, setProgrammingLanguages] = useState([]);
  const [types, setTypes] = useState([]);
  const [statuses, setStatuses] = useState(['upcoming', 'live']); 
  const [sortCriteria, setSortCriteria] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();
  const { username, handleLogin } = useContext(UserContext);

  useEffect(() => {
    const fetchAudits = async () => {
      try {
        const response = await fetch('https://codecallbackend.vercel.app/competitions');
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
    navigate(`/competition/${id}`);
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

  const getRemainingTime = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const judgingEnd = new Date(endDate);
    judgingEnd.setDate(end.getDate() + 14); 
  
    if (now < start) {
      return 'upcoming';
    } else if (now >= start && now < end) {
      return 'live';
    } else if (now >= end && now < judgingEnd) {
      return 'judging';
    } else {
      return 'ended';
    }
  };
  
  const filteredAudits = audits.filter(audit => {
    const languageMatch = programmingLanguages.length === 0 || programmingLanguages.some(lang => audit.languages.includes(lang));
  
    const typeMatch = types.length === 0 || types.some(type => audit.types.includes(type));
  
    const currentStatus = getRemainingTime(audit.startDate, audit.endDate).toLowerCase(); 
    const statusMatch = statuses.length === 0 || statuses.includes(currentStatus);
  
    const searchMatch = audit.name.toLowerCase().includes(searchTerm.toLowerCase()) || audit.description.toLowerCase().includes(searchTerm.toLowerCase());
  
    return languageMatch && typeMatch && statusMatch && searchMatch;
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
        <h1 className="title">Projects</h1>
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
                  onChange={() => handleTypeChange('Feature')}
                  checked={types.includes('Feature')}
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
            <button className="dropbtn">Status</button>
            <div className="dropdown-content">
              <label>
                <input
                  type="checkbox"
                  value="live"
                  onChange={() => handleStatusChange('live')}
                  checked={statuses.includes('live')}
                />
                Live
              </label>
              <label>
                <input
                  type="checkbox"
                  value="upcoming"
                  onChange={() => handleStatusChange('upcoming')}
                  checked={statuses.includes('upcoming')}
                />
                Upcoming
              </label>
              <label>
                <input
                  type="checkbox"
                  value="judging"
                  onChange={() => handleStatusChange('judging')}
                  checked={statuses.includes('judging')}
                />
                Judging
              </label>
              <label>
                <input
                  type="checkbox"
                  value="ended"
                  onChange={() => handleStatusChange('ended')}
                  checked={statuses.includes('ended')}
                />
                Ended
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
              placeholder="Search Project..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>
        <div className="content">
          <div className="audits-list">
            {sortedAudits?.map((audit) => {
              const rewards = calculateRewards(audit.reward);
              const status = getRemainingTime(audit.startDate, audit.endDate).toLowerCase();
              return (
                <div className="audit-card" key={audit._id}>
                  <div className={`audit-info ${status}`}>
                    <div className="audit-price-container">
                      <div className="audit-price">
                        <img src={usdcIcon} alt="USDC" className="usdc-icon" />
                        <span>{audit.reward}</span>
                        <FaInfoCircle className="info-icon" />
                        <div className="info-tooltip">
                          <strong>Rewards for this contest comprise a pool broken down into the following categories:</strong>
                          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                            <div><img src={usdcIcon} alt="USDC" className="usdc-icon" /> {Math.round(audit.reward * 0.5)} Feature</div>
                            <div><img src={usdcIcon} alt="USDC" className="usdc-icon" /> {Math.round(audit.reward * 0.1)} Optimization</div>
                            <div><img src={usdcIcon} alt="USDC" className="usdc-icon" /> {Math.round(audit.reward * 0.2)} Judging</div>
                            <div><img src={usdcIcon} alt="USDC" className="usdc-icon" /> {Math.round(audit.reward * 0.2)} Bugs</div>
                          </div>
                        </div>
                      </div>
                      <small>{audit.points} XP</small>
                    </div>
                    <div className="audit-status">
                      <span className={`blinking-dot ${status}`}></span>
                      <span className={`status ${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
                    </div>
                  </div>
                  <div className="audit-main">
                    <div className="audit-header">
                      <div className="audit-image">
                        <img src={audit.image} alt={audit.name} />
                      </div>
                      <h2>{audit.name}</h2>
                      <div className="audit-tags">
                        {audit.languages.map(lang => <span key={lang} className={lang}>{lang}</span>)}
                        {audit.types.map(type => <span key={type} className={type.replace(/\s/g, '')}>{type}</span>)}
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
              <h3>For Engineers</h3>
              <p>Join the world's best engineers and register to participate in our Projects. Enhance codebases to receive rewards and climb the leaderboard to become a top developer..</p>
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
              <p>Access hundreds of engineers uncovering enhancing your codebase while our proprietary reviewing system speeds up development at scale.</p>
              <button className="styled-button" onClick={() => window.location.href='https://www.codecall.xyz/contact#contact'}>List Project</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
