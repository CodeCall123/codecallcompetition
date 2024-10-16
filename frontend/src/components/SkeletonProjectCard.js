import React from 'react'
import '../styles/Skeleton.css';

const SkeletonProjectCard = () => {
    return (
        <div className="skeleton-card">
            <div className="skeleton-rectangle"></div>
            <div className="skeleton-content">
                <div className="skeleton-title"></div>
                <div className="skeleton-description"></div>
            </div>
        </div>
        
    );
}

export default SkeletonProjectCard