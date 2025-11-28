
import React from 'react';
import { usePageData } from '../hooks/usePageData';

const SeasonalRibbon: React.FC = () => {
    const { isSeasonalModeActive } = usePageData();

    if (!isSeasonalModeActive) {
        return null;
    }

    return (
        <div className="seasonal-ribbon">
            <i className="fas fa-snowflake mr-2"></i>
            <span>Seasonal Mode Active (Nov–Jan)</span>
        </div>
    );
};
export default SeasonalRibbon;
