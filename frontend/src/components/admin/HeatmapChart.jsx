import React from 'react';

const HeatmapChart = ({ data, title }) => {
    const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const mealTypes = ['breakfast', 'lunch', 'snacks', 'dinner'];
    
    // Find max value for color scaling
    const maxValue = Math.max(...data.map(d => Math.max(d.breakfast, d.lunch, d.snacks, d.dinner)));
    
    const getColorIntensity = (value) => {
        if (maxValue === 0) return 0;
        return value / maxValue;
    };
    
    const getBackgroundColor = (intensity) => {
        const opacity = Math.max(0.1, intensity);
        return `rgba(220, 53, 69, ${opacity})`;
    };

    return (
        <div className="heatmap-container">
            <h6 className="text-center mb-3">{title}</h6>
            <div className="table-responsive">
                <table className="table table-bordered text-center">
                    <thead>
                        <tr>
                            <th className="bg-light">Day / Meal</th>
                            {mealTypes.map(meal => (
                                <th key={meal} className="bg-light text-capitalize">
                                    {meal}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((dayData, index) => (
                            <tr key={dayData.day}>
                                <td className="fw-bold bg-light">{dayData.day}</td>
                                {mealTypes.map(meal => {
                                    const value = dayData[meal] || 0;
                                    const intensity = getColorIntensity(value);
                                    return (
                                        <td
                                            key={meal}
                                            style={{
                                                backgroundColor: getBackgroundColor(intensity),
                                                color: intensity > 0.5 ? 'white' : 'black',
                                                fontWeight: intensity > 0.3 ? 'bold' : 'normal'
                                            }}
                                        >
                                            {value}
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="d-flex justify-content-between align-items-center mt-2">
                <small className="text-muted">Low Activity</small>
                <div className="d-flex">
                    {[0.1, 0.3, 0.5, 0.7, 0.9].map(intensity => (
                        <div
                            key={intensity}
                            className="me-1"
                            style={{
                                width: '20px',
                                height: '15px',
                                backgroundColor: getBackgroundColor(intensity),
                                border: '1px solid #dee2e6'
                            }}
                        ></div>
                    ))}
                </div>
                <small className="text-muted">High Activity</small>
            </div>
        </div>
    );
};

export default HeatmapChart;
