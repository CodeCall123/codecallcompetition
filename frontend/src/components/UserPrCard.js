import React from 'react'
import { FaGithub } from 'react-icons/fa';
import { PiGitPullRequestDuotone } from 'react-icons/pi';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { Diff, Hunk } from 'react-diff-view';

const UserPrCard = ({userPRs,username,expandedPRs,togglePR,prDiffs,parseDiff}) => {
    const userCreatedPRs = userPRs.filter(pr => pr.user.login === username);
  
    return userCreatedPRs.map(pr => (
      <div key={pr.id} className="pr-container">
      <button onClick={() => togglePR(pr.number)}>
        <span><PiGitPullRequestDuotone size={20} /> {pr.title}</span>
        <div className="pr-labels" style={{ padding: '10px'}}>
        {!pr.labels.length && <span className="pr-label" style={{ backgroundColor: '#ccc', color: 'black', padding: '2px 4px', borderRadius: '3px', marginRight: '5px' }}>No labels</span>}
        {pr.labels.map(label => (
          <span
          key={label.id}
          className="pr-label"
          style={{ backgroundColor: `#${label.color}`, color: '#fff', padding: '2px 4px', borderRadius: '3px', marginRight: '5px' }}
          >
          {label.name}
          </span>
        ))}
        {pr.state === 'open' ? (
          <span className="pr-label" style={{ backgroundColor: '#28a745', color: '#fff', padding: '2px 4px', borderRadius: '3px' }}>
          <FaGithub /> Open
          </span>
        ) : (
          <span className="pr-label" style={{ backgroundColor: '#cb2431', color: '#fff', padding: '2px 4px', borderRadius: '3px' }}>
          <FaGithub /> Closed
          </span>
        )}
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
}

export default UserPrCard