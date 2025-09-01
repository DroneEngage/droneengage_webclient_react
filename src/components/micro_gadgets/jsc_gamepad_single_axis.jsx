import React from 'react';

export class ClssSingleAxisProgressControl extends React.Component {
    render() {
        const { value = 0, p_axis = 'horizontal', label = 'Axis', color = '#FF4444', min = -1, max = 1 } = this.props;
        // Normalize value to 0-1 range based on min and max
        const normalizedValue = Math.max(min, Math.min(max, value));
        const scaledValue = (normalizedValue - min) / (max - min); // Maps value to 0-1
        const isHorizontal = p_axis === 'horizontal';
        
        // SVG dimensions and styling
        const width = isHorizontal ? 128 : 20;
        const height = isHorizontal ? 20 : 128;
        const viewBox = isHorizontal ? '-6.8 -0.5 2.2 12' : '-0.5 -6.8 2.2 12';

        // Calculate number of bars and their positions
        const numBars = 20;
        const barSpacing = 12 / (numBars - 1); // Full range from -6 to 6
        const barWidth = isHorizontal ? 1.7 : 0.4;
        const barHeight = isHorizontal ? 0.4 : 1.7;
        
        // Calculate active bars: value=0 -> half bars, min -> 0 bars, max -> all bars
        const activeBars = Math.round(scaledValue * (numBars - 1)); // 0 to numBars-1
        
        // Generate bars
        const bars = Array.from({ length: numBars }, (_, index) => {
            const pos = index * barSpacing - 6; // Span from -6 to 6
            const isActive = index <= activeBars; // Activate bars up to activeBars count
            const fillColor = isActive ? color : '#444';
            
            return isHorizontal ? (
                <rect
                    key={index}
                    x={pos - barWidth / 2} // Center bars on position
                    y={-barHeight / 2}
                    width={barWidth}
                    height={barHeight}
                    fill={fillColor}
                />
            ) : (
                <rect
                    key={index}
                    x={-barWidth / 2}
                    y={pos - barHeight / 2} // Center bars on position
                    width={barHeight}
                    height={barWidth}
                    fill={fillColor}
                />
            );
        });

        return (
            <div>
                <svg viewBox={viewBox} width={width} height={height}>
                    {/* Background line */}
                    {isHorizontal ? (
                        <line x1="-6" y1="0" x2="6" y2="0" stroke="#888" strokeWidth="0.04" />
                    ) : (
                        <line x1="0" y1="-6" x2="0" y2="6" stroke="#888" strokeWidth="0.04" />
                    )}
                    {/* Equalizer bars */}
                    {bars}
                    {/* Label */}
                    <text
                        textAnchor="middle"
                        fill="#CCC"
                        fontSize="0.3"
                        x={isHorizontal ? 0 : -0.7}
                        y={isHorizontal ? 0.7 : 0}
                    >
                        {label}: {normalizedValue.toFixed(2)}
                    </text>
                </svg>
            </div>
        );
    }
}