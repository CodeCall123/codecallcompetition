import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { coy } from 'react-syntax-highlighter/dist/esm/styles/prism'; 
import { FaGithub, FaGlobe, FaInfoCircle } from 'react-icons/fa';
import { UserContext } from '../contexts/UserContext';
import { Diff, Hunk, parseDiff } from 'react-diff-view';
import 'react-diff-view/style/index.css';
import '../styles/TrainingDetails.css';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { Controlled as CodeMirror } from 'react-codemirror2';
import 'codemirror/lib/codemirror.css';
import 'codemirror/mode/python/python'; 
import 'codemirror/theme/dracula.css'; 

const HowToGuide = ({ content }) => {
  return (
    <ReactMarkdown
      children={content}
      components={{
        code({ node, inline, className, children, ...props }) {
          const match = /language-(\w+)/.exec(className || '');
          return !inline && match ? (
            <SyntaxHighlighter style={coy} language={match[1]} PreTag="div" {...props}>
              {String(children).replace(/\n$/, '')}
            </SyntaxHighlighter>
          ) : (
            <code className={className} {...props}>
              {children}
            </code>
          );
        }
      }}
    />
  );
};

const TrainingDetails = () => {
  const { id } = useParams();
  const { username, accessToken } = useContext(UserContext);
  const [training, setTraining] = useState(null);
  const [activeTab, setActiveTab] = useState('details');
  const [repoContents, setRepoContents] = useState([]);
  const [userCommits, setUserCommits] = useState([]);
  const [userPRs, setUserPRs] = useState([]);
  const [prDiffs, setPrDiffs] = useState({});
  const [expandedPRs, setExpandedPRs] = useState([]);
  const [expandedFolders, setExpandedFolders] = useState({});
  const [hintsVisible, setHintsVisible] = useState([]);
  const [code, setCode] = useState('# Write your code here\n'); 
  const [output, setOutput] = useState('');

  useEffect(() => {
    const fetchTraining = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/training/${id}`);
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        const data = await response.json();
        setTraining(data);
        setHintsVisible(new Array(data.hints.length).fill(false));
        setCode(data.starterCode);
      } catch (error) {
        console.error('Error fetching training details:', error);
      }
    };

    fetchTraining();
  }, [id]);

  useEffect(() => {
    if (training && training.repositoryLink) {
      const fetchRepoContents = async () => {
        try {
          const repoUrl = new URL(training.repositoryLink).pathname.substring(1);
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
  }, [training]);

  useEffect(() => {
    if (training && accessToken) {
      const fetchUserCommits = async () => {
        try {
          const repoUrl = new URL(training.repositoryLink).pathname.substring(1);
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
          const repoUrl = new URL(training.repositoryLink).pathname.substring(1);
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
  }, [training, accessToken, username]);

  const handleLogin = () => {
    const clientID = process.env.REACT_APP_GITHUB_CLIENT_ID;
    const redirectUri = process.env.REACT_APP_REDIRECT_URI;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${clientID}&redirect_uri=${redirectUri}`;
  };

  const fetchPrDiff = async (prNumber) => {
    try {
      const repoUrl = new URL(training.repositoryLink).pathname.substring(1);
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
    const isExpanded = expandedFolders[item.sha] || false;

    const toggleFolder = () => {
      setExpandedFolders(prevState => ({
        ...prevState,
        [item.sha]: !isExpanded
      }));
    };

    useEffect(() => {
      if (isExpanded && contents.length === 0) {
        const fetchFolderContents = async () => {
          try {
            const response = await fetch(item.url);
            const data = await response.json();
            setContents(data);
          } catch (error) {
            console.error('Error fetching folder contents:', error);
          }
        };

        fetchFolderContents();
      }
    }, [isExpanded, item.url, contents.length]);

    return (
      <div>
        <div onClick={toggleFolder}>
          {isExpanded ? '📂' : '📁'} {item.name}
        </div>
        {isExpanded && renderRepoContents(contents)}
      </div>
    );
  };

  const File = ({ item }) => (
    <div>
      📄 {item.name}
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

  const runCode = () => {
    const executePythonCode = async (code) => {
      try {
        const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/execute-python`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ code })
        });
  
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`HTTP error! Status: ${response.status}, Response: ${errorText}`);
        }
  
        const data = await response.json();
        setOutput(data.output);
        checkResults(data.output);
      } catch (error) {
        setOutput(String(error));
      }
    };
  
    executePythonCode(code);
  };
  
  const checkResults = async (result) => {
    console.log(`Checking results: ${result}`); 
  
    for (let i = 0; i < training.tests.length; i++) {
      const { input, expectedOutput } = training.tests[i];
      if (result.trim() === expectedOutput.trim()) {
        await awardXP(i + 1); 
        return;
      }
    }
  };
  
  const awardXP = async (taskNumber) => {
    console.log(`Awarding XP for Task ${taskNumber}`); 
    try {
      const response = await fetch('http://localhost:5001/awardXP', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username,
          taskId: taskNumber,
          trainingId: training._id
        })
      });
  
      const data = await response.json();
      console.log(`Award XP response: ${JSON.stringify(data)}`); 
      if (data.success) {
        alert(`XP awarded for Task ${taskNumber}`);
      } else if (data.message === 'Task already completed') {
        alert('Correct! Though, we can\'t give you any more XP for this task.');
      } else {
        alert('Error awarding XP');
      }
    } catch (error) {
      console.error('Error awarding XP:', error.message);
    }
  };
  
  const renderRewardDistribution = () => {
    if (!training) return null;
    const points = {
      feature: Math.round(training.points * 0.05),
      optimization: Math.round(training.points * 0.1),
      judging: Math.round(training.points * 0.15),
      bugs: Math.round(training.points * 0.2)
    };

    return (
<div className="reward-container">
  <div className="reward-item container1">
    <span className="reward-tag feature">Task 1</span>
    <span>{points.feature} XP</span>
  </div>
  <div className="reward-item container1">
    <span className="reward-tag optimization">Task 2</span>
    <span>{points.optimization} XP</span>
  </div>
  <div className="reward-item container1">
    <span className="reward-tag bug">Task 3</span>
    <span>{points.judging} XP</span>
  </div>
  <div className="reward-item container1">
    <span className="reward-tag judging">Task 4</span>
    <span>{points.bugs} XP</span>
  </div>
</div>

    );
  };

  const renderHints = () => {
    if (!training) return null;
    return training.hints.map((hint, index) => (
      <div className="reward-item container" key={index}>
        <div className="hint-row">
          <span className="reward-tag hint">Hint {index + 1}</span>
          <ExpandMoreIcon className="expand-icon" onClick={() => toggleHintVisibility(index)} />
        </div>
        {hintsVisible[index] && (
          <div className="hint-content">
            <pre>{hint}</pre>
          </div>
        )}
      </div>
    ));
  };

  const toggleHintVisibility = (index) => {
    setHintsVisible(prevState => {
      const newState = [...prevState];
      newState[index] = !newState[index];
      return newState;
    });
  };

  if (!training) {
    return <div></div>;
  }

  return (
    <div className="training-details-wrapper">
      <div className="training-content">
        <div className="training-header">
          <div className="header-icons">
            <a href={training.repositoryLink} target="_blank" rel="noopener noreferrer">
              <FaGithub size={30} />
            </a>
          </div>
          <img src={training.image} alt={training.name} className="training-image" />
          <div className="header-content">
            <div className="title-subtitle">
              <h1 className="training-title">{training.name}</h1>
              <p className="training-subtitle"></p>
            </div>
          </div>
        </div>
        <div className="training-info-container">
          <div className="info-left">
            <div className="price">
              <div className="price-container">
                <span>{training.points} XP</span>
                <FaInfoCircle className="info-icon" />
                <div className="info-tooltip">
                  <strong>Rewards for this contest comprise a pool broken down into the following categories:</strong>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className="reward-item feature">{Math.round(training.points * 0.05)} XP Task 1</div>
                    <div className="reward-item optimization">{Math.round(training.points * 0.1)} XP Task 2</div>
                    <div className="reward-item judging">{Math.round(training.points * 0.15)} XP Task 3</div>
                    <div className="reward-item bugs">{Math.round(training.points * 0.2)} XP Task 4</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="tags">
              {training.languages.map((lang, index) => (
                <span key={index} className={`tag ${lang.toLowerCase()}`}>{lang}</span>
              ))}
              {training.types.map((type, index) => (
                <span key={index} className={`tag ${type.toLowerCase().replace(/\s/g, '-')}`}>{type}</span>
              ))}
              <span className={`tag difficulty ${training.difficulty.toLowerCase()}`}>{training.difficulty}</span>
            </div>
          </div>
          <div className="info-right">
            <h3>Description</h3>
            <p>{training.description}</p>
          </div>
        </div>
        <div className="training-main-content">
          <div className="tabs">
            <button className={activeTab === 'details' ? 'active' : ''} onClick={() => setActiveTab('details')}>Details</button>
            <button className={activeTab === 'howTo' ? 'active' : ''} onClick={() => setActiveTab('howTo')}>How to</button>
          </div>
          <div className="tab-content">
            {activeTab === 'details' && (
              <div>
                <h2>Details</h2>
                <p>{training.trainingDetails}</p>
              </div>
            )}
            {activeTab === 'howTo' && (
              <div>
                <HowToGuide content={training.howToGuide} />
              </div>
            )}
  
          </div>

          <div className="submissions-container">
            {!username ? (
              <div className="login-prompt" onClick={handleLogin}>
                <p>Login with GitHub to contribute code</p>
              </div>
            ) : (
              <div className="submission-area">
                <p>To complete each task add your code here and run it. You will know if the task was completed when the task becomes crossed out.</p>
                <CodeMirror
                  value={code}
                  options={{
                    mode: 'python',
                    theme: 'dracula', 
                    lineNumbers: true
                  }}
                  onBeforeChange={(editor, data, value) => {
                    setCode(value);
                  }}
                />
                <button onClick={runCode} className="styled-button">Run Code</button>
                <pre>{output}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="training-side-container">
        {renderRewardDistribution()}
        <div className="reward-card">
          <h3>Hints</h3>
          <div className="reward-container">
            {renderHints()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrainingDetails;
