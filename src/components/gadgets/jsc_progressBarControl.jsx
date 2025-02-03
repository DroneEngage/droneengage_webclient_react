import React from 'react';
import PropTypes from 'prop-types';

export default class ClssProgressBarControl extends React.Component {
    static propTypes = {
        percent: PropTypes.number.isRequired, // Percentage of progress (0-100)
        height: PropTypes.string,          // Height of the progress bar (e.g., "10px", "1rem")
        backgroundColor: PropTypes.string, // Background color of the bar
        foregroundColor: PropTypes.string, // Color of the progress indicator
        borderRadius: PropTypes.string,    // Border radius of the bar
        label: PropTypes.bool,            // Whether to show the percentage label
        labelColor: PropTypes.string,       // Color of the label text
    };

    static defaultProps = {
        height: '10px',
        backgroundColor: '#e0e0e0',
        foregroundColor: '#4CAF50',
        borderRadius: '5px',
        label: true,
        labelColor: 'black',
    };

    render() {
        const { percent, height, backgroundColor, foregroundColor, borderRadius, label, labelColor } = this.props;

        const containerStyle = {
            width: '100%',
            height: height,
            backgroundColor: backgroundColor,
            borderRadius: borderRadius,
            overflow: 'hidden', // Hide overflow of the progress indicator
            position: 'relative', // For absolute positioning of the label
        };

        const progressStyle = {
            width: `${percent}%`,
            height: '100%',
            backgroundColor: foregroundColor,
            borderRadius: borderRadius,
            transition: 'width 0.3s ease-in-out', // Smooth width transition
        };

        const labelStyle = {
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: labelColor,
            fontSize: 'smaller', // Adjust as needed
            whiteSpace: 'nowrap', // Prevent label from wrapping
        };

        return (
            <div style={containerStyle}>
                <div style={progressStyle}></div>
                {label && <div style={labelStyle}>{percent.toFixed(0)}%</div>}
            </div>
        );
    }
}