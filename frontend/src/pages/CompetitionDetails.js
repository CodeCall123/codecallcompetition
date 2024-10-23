import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { FaGithub, FaGlobe, FaInfoCircle } from 'react-icons/fa';
import { UserContext } from '../contexts/UserContext';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import '../styles/CompetitionDetails.css';
import usdcIcon from '../assets/images/usdc.png';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import remarkGfm from 'remark-gfm';

const CompetitionDetails = () => {
  const { id } = useParams();
  const { username, accessToken } = useContext(UserContext);
  const [competition, setCompetition] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [countdown, setCountdown] = useState('');
  const [repoContents, setRepoContents] = useState([]);
  const [userCommits, setUserCommits] = useState([]);
  const [userPRs, setUserPRs] = useState([]);
  const [prDiffs, setPrDiffs] = useState({});
  const [expandedPRs, setExpandedPRs] = useState([]);
  const [isJudge, setIsJudge] = useState(false);
  const [isLeadJudge, setIsLeadJudge] = useState(false);

  useEffect(() => {
    const fetchCompetition = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/competitions/${id}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setCompetition(data);
      } catch (error) {
        console.error('Error fetching competition details:', error);
      }
    };

    fetchCompetition();
  }, [id]);

  const checkUserRole = (competition) => {
    if (!competition || !username) return;

    const isLeadJudge = competition.judges.leadJudge && competition.judges.leadJudge.username === username;
    const isJudge = competition.judges.judges.some(judge => judge.username === username);

    setIsLeadJudge(isLeadJudge);
    setIsJudge(isLeadJudge || isJudge);
  };

  const getRemainingTime = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);
    const judgingEnd = new Date(endDate);
    judgingEnd.setDate(end.getDate() + 14); // Add 14 days for judging period
  
    let statusMessage = '';
    let timeRemaining = '';
  
    const formatTime = (milliseconds) => {
      const totalSeconds = Math.floor(milliseconds / 1000);
      const days = Math.floor(totalSeconds / (3600 * 24));
      const hours = Math.floor((totalSeconds % (3600 * 24)) / 3600);
      const minutes = Math.floor((totalSeconds % 3600) / 60);
      const seconds = totalSeconds % 60;
  
      if (days > 0) {
        return `${days} days ${hours} hours`;
      } else if (hours > 0) {
        return `${hours} hours ${minutes} minutes`;
      } else if (minutes > 0) {
        return `${minutes} minutes ${seconds} seconds`;
      } else {
        return `${seconds} seconds`;
      }
    };
  
    if (now < start) {
      statusMessage = 'upcoming'; // Time is before startDate
      timeRemaining = `Starts in ${formatTime(start - now)}`;
    } else if (now >= start && now < end) {
      statusMessage = 'live'; // Time is between startDate and endDate
      timeRemaining = `Ends in ${formatTime(end - now)}`;
    } else if (now >= end && now < judgingEnd) {
      statusMessage = 'judging'; // Time is between endDate and 14 days after
      timeRemaining = `Judging ends in ${formatTime(judgingEnd - now)}`;
    } else {
      statusMessage = 'ended'; // Time is after judgingEnd
      timeRemaining = 'Competition has ended';
    }
  
    return { statusMessage, timeRemaining };
  };
  

  // Countdown Effect: Fix the parameters and ensure proper state updates
  useEffect(() => {
    if (competition) {
      const intervalId = setInterval(() => {
        const { statusMessage, timeRemaining } = getRemainingTime(competition.startDate, competition.endDate);
        setCountdown(` (${timeRemaining})`);
      }, 1000);

      return () => clearInterval(intervalId);
    }
  }, [competition]);

  useEffect(() => {
    if (competition && competition.repositoryLink) {
      const fetchRepoContents = async () => {
        try {
          const repoUrl = new URL(competition.repositoryLink).pathname.substring(1);
          const apiUrl = `https://api.github.com/repos/${repoUrl}/contents`;
          const response = await fetch(apiUrl);
          const data = await response.json();
          setRepoContents(data);
        } catch (error) {
          console.error('Error fetching repository contents:', error);
        }
      };

      fetchRepoContents();
    }
  }, [competition]);

  useEffect(() => {
    if (competition && accessToken) {
      const fetchUserCommits = async () => {
        try {
          const repoUrl = new URL(competition.repositoryLink).pathname.substring(1);
          const apiUrl = `https://api.github.com/repos/${repoUrl}/commits?author=${username}`;
          const response = await fetch(apiUrl, {
            headers: {
              Authorization: `token ${accessToken}`
            }
          });
          if (!response.ok) {
            throw new Error(`Error fetching commits: ${response.statusText}`);
          }
          const data = await response.json();
          setUserCommits(Array.isArray(data) ? data : []);
        } catch (error) {
          console.error('Error fetching user commits:', error);
          setUserCommits([]);
        }
      };

      const fetchUserPRs = async () => {
        try {
          const repoUrl = new URL(competition.repositoryLink).pathname.substring(1);
          const apiUrl = `https://api.github.com/repos/${repoUrl}/pulls?state=all&creator=${username}`;
          const response = await fetch(apiUrl, {
            headers: {
              Authorization: `token ${accessToken}`
            }
          });
          if (!response.ok) {
            throw new Error(`Error fetching pull requests: ${response.statusText}`);
          }
          const data = await response.json();
          setUserPRs(Array.isArray(data) ? data : []);
      
          data.forEach(pr => fetchPrDiff(pr.number));
        } catch (error) {
          console.error('Error fetching user pull requests:', error);
          setUserPRs([]);
        }
      };

      fetchUserCommits();
      fetchUserPRs();
    }
  }, [competition, accessToken, username]);

  const handleLogin = () => {
    const clientID = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_REDIRECT_URI;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectUri}`;
  };

  const fetchPrDiff = async (prNumber) => {
    try {
      const repoUrl = new URL(competition.repositoryLink).pathname.substring(1);
      const apiUrl = `https://api.github.com/repos/${repoUrl}/pulls/${prNumber}`;
      const response = await fetch(apiUrl, {
        headers: {
          Authorization: `token ${accessToken}`,
          Accept: 'application/vnd.github.v3.diff'
        }
      });
      if (!response.ok) {
        throw new Error(`Error fetching PR diff: ${response.statusText}`);
      }
      const data = await response.text();
      setPrDiffs((prevDiffs) => ({
        ...prevDiffs,
        [prNumber]: data
      }));
    } catch (error) {
      console.error('Error fetching PR diff:', error);
    }
  };

  const togglePR = (prNumber) => {
    setExpandedPRs((prevExpandedPRs) => {
      if (prevExpandedPRs.includes(prNumber)) {
        return prevExpandedPRs.filter((num) => num !== prNumber);
      } else {
        return [...prevExpandedPRs, prNumber];
      }
    });
  };

  const renderRepoContents = (contents) => {
    return contents.map((item) => (
      <div key={item.sha} style={{ marginLeft: item.type === 'dir' ? 20 : 0 }}>
        {item.type === 'dir' ? (
          <Folder item={item} />
        ) : (
          <File item={item} />
        )}
      </div>
    ));
  };

  const Folder = ({ item }) => {
    const [contents, setContents] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);

    const toggleFolder = () => {
      setIsExpanded(!isExpanded);
      if (!isExpanded && contents.length === 0) {
        fetchFolderContents();
      }
    };

    const fetchFolderContents = async () => {
      setIsLoading(true);
      try {
        const response = await fetch(item.url);
        const data = await response.json();
        setContents(data);
      } catch (error) {
        console.error('Error fetching folder contents:', error);
      } finally {
        setIsLoading(false);
      }
    };

    return (
      <div>
        <div onClick={toggleFolder} style={{ cursor: 'pointer' }}>
          {isExpanded ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.17 6L11.17 8H20V18H4V6H9.17ZM10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="white"/>
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M9.17 6L11.17 8H20V18H4V6H9.17ZM10 4H4C2.9 4 2.01 4.9 2.01 6L2 18C2 19.1 2.9 20 4 20H20C21.1 20 22 19.1 22 18V8C22 6.9 21.1 6 20 6H12L10 4Z" fill="white"/>
            </svg>
          )} 
          {item.name}
        </div>
        {isExpanded && (
          <div style={{ marginLeft: '20px' }}>
            {isLoading ? (
              <p>Loading...</p>
            ) : (
              contents.length > 0 ? (
                renderRepoContents(contents)
              ) : (
                <p>No contents available</p>
              )
            )}
          </div>
        )}
      </div>
    );
  };

  const File = ({ item }) => (
    <div>
      <svg width="16" height="20" viewBox="0 0 16 20" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M-6.11959e-07 6L-8.74228e-08 18C-3.93402e-08 19.1 0.9 20 2 20L14.01 20C15.11 20 16 19.1 16 18L16 2C16 0.899999 15.1 -6.60042e-07 14 -6.11959e-07L6 -2.62268e-07L-6.11959e-07 6ZM14.01 18L2 18L2 7L7 7L7 2L14.01 2L14.01 18Z" fill="white"/>
      </svg> {item.name}
    </div>
  );
    
  
  const renderCommits = () => {
    return userCommits.map(commit => (
      <div key={commit.sha}>
        <p>{commit.commit.message}</p>
        <p>{commit.commit.author.name} - {new Date(commit.commit.author.date).toLocaleString()}</p>
      </div>
    ));
  };

  const renderPRs = () => {
    const userCreatedPRs = userPRs.filter(pr => pr.user.login === username);
  
    return userCreatedPRs.map(pr => (
      <div key={pr.id} className="pr-container">
        <button onClick={() => togglePR(pr.number)}>
          <span>{pr.title}</span>
          <div className="pr-labels">
            {pr.labels.map(label => (
              <span
                key={label.id}
                className="pr-label"
                style={{ backgroundColor: `#${label.color}`, color: '#fff', padding: '2px 4px', borderRadius: '3px', marginRight: '5px' }}
              >
                {label.name}
              </span>
            ))}
          </div>
          <ChevronRightIcon className="chevron-icon" />
        </button>
        {expandedPRs.includes(pr.number) && prDiffs[pr.number] && (
          <Diff viewType="split" diffType="unified" hunks={parseDiff(prDiffs[pr.number], { nearbySequences: 'zip' })[0].hunks}>
            {(hunks) => hunks.map(hunk => (
              <Hunk key={hunk.content} hunk={hunk} />
            ))}
          </Diff>
        )}
      </div>
    ));
  };

  const renderJudges = () => {
    if (!competition.judges) return null;
  
    return (
      <div className="judges-card">
        <div className="judges-section">
          <h3>Lead Reviewer</h3>
          <p>
            {competition.judges.leadJudge ? (
              <a href={`https://github.com/${competition.judges.leadJudge.username}`} target="_blank" rel="noopener noreferrer">
                {competition.judges.leadJudge.username}
              </a>
            ) : 'No lead reviewer available'}
          </p>
        </div>
        <div className="judges-section">
          <h3>Reviewers</h3>
          <p>
            {competition.judges.judges.length > 0
              ? competition.judges.judges.map(judge => (
                <a key={judge._id} href={`https://github.com/${judge.username}`} target="_blank" rel="noopener noreferrer">
                  {judge.username}
                </a>
              )).reduce((prev, curr) => [prev, ', ', curr])
              : 'No reviewers available'}
          </p>
        </div>
  
        {/* Only show the button if the competition is not 'ended' */}
        {!isJudge && !isLeadJudge && getRemainingTime(competition.startDate, competition.endDate).statusMessage !== 'ended' && (
          <button className="styled-button" onClick={handleBecomeJudge}>Become a Reviewer</button>
        )}
      </div>
    );
  };

  const handleAddJudge = async (type) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/competitions/${id}/addJudge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`
        },
        body: JSON.stringify({ username, type })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }

      const data = await response.json();
      setCompetition(prev => ({
        ...prev,
        judges: data.judges
      }));
    } catch (error) {
      console.error('Error adding judge:', error);
      alert(error.message);
    }
  };

  const handleBecomeJudge = async () => { 
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/competitions/${id}/becomeJudge`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,  
        },
        body: JSON.stringify({ username })
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message);
      }
  
      const data = await response.json();
  

      setCompetition(data); 
      setIsJudge(true); 
    } catch (error) {
      console.error('Error becoming a judge:', error);
      alert(error.message);
    }
  };
  
  
  const renderRewardDistribution = () => {
    if (!competition) return null;
    const rewards = {
      feature: Math.round(competition.reward * 0.5),
      optimization: Math.round(competition.reward * 0.1),
      judging: Math.round(competition.reward * 0.2),
      bugs: Math.round(competition.reward * 0.2)
    };
  
    return (
      <div className="reward-card">
        <h3>Reward Distribution</h3>
        <div className="reward-container">
          <div className="reward-item container">
            <span className="reward-tag feature">Feature</span>
            <span><img src={usdcIcon} alt="USDC" className="usdc-icon" />{rewards.feature}</span>
          </div>
          <div className="reward-item container">
            <span className="reward-tag optimization">Optimization</span>
            <span><img src={usdcIcon} alt="USDC" className="usdc-icon" />{rewards.optimization}</span>
          </div>
          <div className="reward-item container">
            <span className="reward-tag bug">Bug</span>
            <span><img src={usdcIcon} alt="USDC" className="usdc-icon" />{rewards.bugs}</span>
          </div>
          <div className="reward-item container">
            <span className="reward-tag judging">Reviewing</span>
            <span><img src={usdcIcon} alt="USDC" className="usdc-icon" />{rewards.judging}</span>
          </div>
        </div>
      </div>
    );
  };

  if (!competition) {
    return <div></div>;
  }

  return (
    <div className="competition-details-wrapper">
      <div className="competition-content">
        <div className="competition-header">
          <div className="header-icons">
            <a href={competition.repositoryLink} target="_blank" rel="noopener noreferrer">
              <FaGithub size={30} />
            </a>
            <a href={competition.websiteLink} target="_blank" rel="noopener noreferrer">
              <FaGlobe size={30} />
            </a>
          </div>
          <img src={competition.image} alt={competition.name} className="competition-image" />
          <div className="header-content">
            <div className="title-subtitle">
              <h1 className="competition-title">{competition.name}</h1>
              <p className="competition-subtitle"></p>
            </div>
            <div className="live-status">
  <span className={`blinking-dot ${getRemainingTime(competition.startDate, competition.endDate).statusMessage}`}></span>
  <span className={`status ${getRemainingTime(competition.startDate, competition.endDate).statusMessage}`}>
    {getRemainingTime(competition.startDate, competition.endDate).statusMessage.charAt(0).toUpperCase() + getRemainingTime(competition.startDate, competition.endDate).statusMessage.slice(1)}
  </span>
  {getRemainingTime(competition.startDate, competition.endDate).statusMessage !== 'ended' && (
    <span className="countdown">
      {countdown.replace(/\(|\)/g, '')}
    </span>
  )}
</div>
          </div>
        </div>
        <div className="competition-info-container">
          <div className="info-left">
            <div className="price">
              <div className="price-container">
                <img src={usdcIcon} alt="USDC" className="usdc-icon" />
                <span>{competition.reward}</span>
                <FaInfoCircle className="info-icon" />
                <div className="info-tooltip">
                  <strong>Rewards for this contest comprise a pool broken down into the following categories:</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div ><img src={usdcIcon} alt="USDC" className="usdc-icon" /> {Math.round(competition.reward * 0.5)} Feature</div>
                    <div ><img src={usdcIcon} alt="USDC" className="usdc-icon" /> {Math.round(competition.reward * 0.1)} Optimization</div>
                    <div><img src={usdcIcon} alt="USDC" className="usdc-icon" /> {Math.round(competition.reward * 0.2)} Reviewing</div>
                    <div><img src={usdcIcon} alt="USDC" className="usdc-icon" /> {Math.round(competition.reward * 0.2)} Bugs</div>
                  </div>
                </div>
              </div>
              <small>{competition.points} XP</small>
            </div>

            <div className="tags">
              {competition.languages.map((lang, index) => (
                <span key={index} className={`tag ${lang.toLowerCase()}`}>{lang}</span>
              ))}
              {competition.types.map((type, index) => (
                <span key={index} className={`tag ${type.toLowerCase().replace(/\s/g, '-')}`}>{type}</span>
              ))}
            </div>
          </div>
          <div className="info-right">
            <h3>Description</h3>
            <p>{competition.description}</p>
          </div>
        </div>
        <div className="competition-main-content">
          <div className="tabs">
            <button className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>Details</button>
            <button className={activeTab === 'howTo' ? 'active' : ''} onClick={() => setActiveTab('howTo')}>How to</button>
            <button className={activeTab === 'scope' ? 'active' : ''} onClick={() => setActiveTab('scope')}>Scope</button>
          </div>
          <div className="tab-content">
            {activeTab === 'details' && (
              <div>
                <ReactMarkdown 
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 style={{color: 'white', fontFamily: 'Mulish', fontSize: '16px'}} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{color: 'white', fontFamily: 'Mulish', fontSize: '16px'}} {...props} />,
                    p: ({node, ...props}) => <p style={{fontSize: '14px', fontFamily: 'Mulish'}} {...props} />,
                    ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', listStyleType: 'square', fontFamily: 'Mulish'}} {...props} />,
                  }}
                >
                  {competition.competitionDetails}
                </ReactMarkdown>
              </div>
            )}
            {activeTab === 'howTo' && (
              <div>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({node, ...props}) => <p style={{fontSize: '14px', fontFamily: 'Mulish'}} {...props} />,
                    h2: ({node, ...props}) => <h2 style={{color: 'white', fontFamily: 'Mulish', fontSize: '16px'}} {...props} />,
                    h1: ({node, ...props}) => <h1 style={{color: 'white', fontFamily: 'Mulish', fontSize: '16px'}} {...props} />,
                    ul: ({node, ...props}) => <ul style={{paddingLeft: '20px', listStyleType: 'square', fontFamily: 'Mulish'}} {...props} />,
                  }}
                >
                  {competition.howToGuide}
                </ReactMarkdown>
              </div>
            )}
            {activeTab === 'scope' && (
              <div>
                <h2 style={{ fontFamily: 'Mulish' }}>Scope</h2>
                <p style={{ fontFamily: 'Mulish' }}>Below is the scope and files you need to work with, to view the full scope, make sure to visit the projects' github page</p>

                {renderRepoContents(repoContents)}
              </div>
            )}
          </div>
          {isLeadJudge && <button className="styled-button" onClick={() => handleAddJudge('judge')}>Add Reviewer</button>}
          {isLeadJudge && <button className="styled-button" onClick={() => handleAddJudge('leadJudge')}>Add Lead Reviewer</button>}
    
          <div className="submissions-container">
            <h2>Your Submissions</h2>
            {!username ? (
              <div className="login-prompt" onClick={handleLogin}>
                <p>Login with GitHub to contribute code</p>
              </div>
            ) : (
              <div className="submission-area">
                <p>You are logged in. You can now push code to the repository and your pull requests will be shown here.</p>
                <a href={competition.repositoryLink} target="_blank" rel="noopener noreferrer" className="submit-code-button">
                  Go to Repository
                </a>
                {renderPRs()}
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="competition-side-container">
        {renderRewardDistribution()}
        {renderJudges()}
      </div>
    </div>
  );
};

export default CompetitionDetails;
