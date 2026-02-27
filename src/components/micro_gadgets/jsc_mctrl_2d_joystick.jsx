import React from 'react';

/**
 * Generic 2D Joystick Control Component
 * 
 * A reusable rectangular joystick control with draggable circle for X/Y coordinate input.
 * Features double-click activation, position persistence, and comprehensive event handling.
 * 
 * Props:
 * - width: Control width in pixels (default: 200)
 * - height: Control height in pixels (default: 200)
 * - minValue: Minimum value for X/Y axes (default: -500)
 * - maxValue: Maximum value for X/Y axes (default: 500)
 * - circleRadius: Radius of draggable circle in pixels (default: 15)
 * - initialX: Initial X value (default: 0)
 * - initialY: Initial Y value (default: 0)
 * - onClick: Callback for single clicks (x, y)
 * - onDoubleClick: Callback for double clicks (x, y)
 * - onRightClick: Callback for right clicks (x, y)
 * - onDrag: Callback for drag events (x, y)
 * - onRelease: Callback for mouse/touch release (x, y)
 * - className: Additional CSS classes
 * - style: Additional inline styles
 */
export class Class_2D_Joystick extends React.Component {
    constructor(props) {
        super(props);
        
        // Set default props
        const {
            width = 200,
            height = 200,
            minValue = -500,
            maxValue = 500,
            circleRadius = 15,
            initialX = 0,
            initialY = 0
        } = props;

        this.state = {
            isControlMode: false,
            isDragging: false,
            circleX: this.valueToPixels(initialX, width, minValue, maxValue),
            circleY: this.valueToPixels(initialY, height, minValue, maxValue),
            currentX: initialX,
            currentY: initialY
        };

        this.svgRef = React.createRef();
        this.lastClickTime = 0;
        this.dragOffset = { x: 0, y: 0 };
    }

    componentDidUpdate(prevProps) {
        // Reset position if initialX or initialY props change
        if (prevProps.initialX !== this.props.initialX || prevProps.initialY !== this.props.initialY) {
            const { initialX = 0, initialY = 0, width = 200, height = 200, minValue = -500, maxValue = 500 } = this.props;
            
            this.setState({
                circleX: this.valueToPixels(initialX, width, minValue, maxValue),
                circleY: this.valueToPixels(initialY, height, minValue, maxValue),
                currentX: initialX,
                currentY: initialY
            });
        }
    }

    componentDidMount() {
        // Add global mouse event listeners for drag handling
        document.addEventListener('mousemove', this.handleGlobalMouseMove);
        document.addEventListener('mouseup', this.handleGlobalMouseUp);
        document.addEventListener('touchmove', this.handleGlobalTouchMove);
        document.addEventListener('touchend', this.handleGlobalTouchEnd);
    }

    componentWillUnmount() {
        // Clean up global event listeners
        document.removeEventListener('mousemove', this.handleGlobalMouseMove);
        document.removeEventListener('mouseup', this.handleGlobalMouseUp);
        document.removeEventListener('touchmove', this.handleGlobalTouchMove);
        document.removeEventListener('touchend', this.handleGlobalTouchEnd);
    }

    valueToPixels = (value, dimension, minValue, maxValue) => {
        // Convert value range to pixel coordinates within the inner rectangle
        const valueRange = maxValue - minValue;
        const circleRadius = this.props.circleRadius || 15;
        
        // Calculate inner rectangle dimensions
        const innerDimension = (valueRange / (valueRange + 2 * circleRadius)) * dimension;
        const innerOffset = (dimension - innerDimension) / 2;
        
        // Map value to inner rectangle, then add offset
        const innerPosition = ((value - minValue) / valueRange) * innerDimension;
        return innerPosition + innerOffset;
    }

    pixelsToValue = (pixels, dimension, minValue, maxValue) => {
        // Convert pixel coordinates to value range, accounting for inner rectangle
        const valueRange = maxValue - minValue;
        const circleRadius = this.props.circleRadius || 15;
        
        // Calculate inner rectangle dimensions
        const innerDimension = (valueRange / (valueRange + 2 * circleRadius)) * dimension;
        const innerOffset = (dimension - innerDimension) / 2;
        
        // Convert to inner rectangle coordinates, then to value
        const innerPosition = pixels - innerOffset;
        return (innerPosition / innerDimension) * valueRange + minValue;
    }

    isPointInCircle = (mouseX, mouseY, circleX, circleY, radius) => {
        const distance = Math.sqrt(Math.pow(mouseX - circleX, 2) + Math.pow(mouseY - circleY, 2));
        return distance <= radius;
    }

    constrainToRectangle = (x, y, width, height, radius) => {
        // Allow circle center to reach inner rectangle edges for max/min values
        // but keep circle edge within outer rectangle bounds
        const { minValue = -500, maxValue = 500 } = this.props;
        const valueRange = maxValue - minValue;
        
        // Calculate inner rectangle boundaries
        const innerWidth = (valueRange / (valueRange + 2 * radius)) * width;
        const innerHeight = (valueRange / (valueRange + 2 * radius)) * height;
        const innerX = (width - innerWidth) / 2;
        const innerY = (height - innerHeight) / 2;
        
        return {
            x: Math.max(innerX, Math.min(innerX + innerWidth, x)),
            y: Math.max(innerY, Math.min(innerY + innerHeight, y))
        };
    }

    getMousePosition = (event) => {
        const svg = this.svgRef.current;
        if (!svg) return { x: 0, y: 0 };

        const rect = svg.getBoundingClientRect();
        const clientX = event.touches ? event.touches[0].clientX : event.clientX;
        const clientY = event.touches ? event.touches[0].clientY : event.clientY;

        return {
            x: clientX - rect.left,
            y: clientY - rect.top
        };
    }

    handleMouseDown = (event) => {
        event.preventDefault();
        const { x: mouseX, y: mouseY } = this.getMousePosition(event);
        const { circleRadius } = this.props;
        const { circleX, circleY, isControlMode } = this.state;

        if (!isControlMode) return;

        // Check if click is on the circle
        if (this.isPointInCircle(mouseX, mouseY, circleX, circleY, circleRadius)) {
            this.dragOffset = {
                x: mouseX - circleX,
                y: mouseY - circleY
            };
            this.setState({ isDragging: true });
        }
    }

    handleGlobalMouseMove = (event) => {
        if (!this.state.isDragging) return;

        const { width, height, minValue, maxValue, circleRadius, onDrag } = this.props;
        const { x: mouseX, y: mouseY } = this.getMousePosition(event);

        // Calculate new circle position with drag offset
        let newCircleX = mouseX - this.dragOffset.x;
        let newCircleY = mouseY - this.dragOffset.y;

        // Constrain to rectangle bounds
        const constrained = this.constrainToRectangle(newCircleX, newCircleY, width, height, circleRadius);
        newCircleX = constrained.x;
        newCircleY = constrained.y;

        // Convert to value range
        const valueX = this.pixelsToValue(newCircleX, width, minValue, maxValue);
        const valueY = this.pixelsToValue(newCircleY, height, minValue, maxValue);

        this.setState({
            circleX: newCircleX,
            circleY: newCircleY,
            currentX: valueX,
            currentY: valueY
        });

        if (onDrag) {
            onDrag(valueX, valueY);
        }
    }

    handleGlobalMouseUp = (event) => {
        if (!this.state.isDragging) return;

        const { onRelease } = this.props;
        const { currentX, currentY } = this.state;

        this.setState({ isDragging: false });

        if (onRelease) {
            onRelease(currentX, currentY);
        }
    }

    handleGlobalTouchMove = (event) => {
        if (!this.state.isDragging) return;
        event.preventDefault();
        this.handleGlobalMouseMove(event);
    }

    handleGlobalTouchEnd = (event) => {
        if (!this.state.isDragging) return;
        this.handleGlobalMouseUp(event);
    }

    handleClick = (event) => {
        event.preventDefault();
        const { x: mouseX, y: mouseY } = this.getMousePosition(event);
        const { minValue, maxValue, onClick } = this.props;
        const { isControlMode } = this.state;

        if (isControlMode) return; // Don't handle clicks when in control mode

        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastClickTime;

        if (timeDiff < 300) { // Double click detected
            this.handleDoubleClick(mouseX, mouseY);
        } else {
            this.lastClickTime = currentTime;
            
            if (onClick) {
                const valueX = this.pixelsToValue(mouseX, this.props.width, minValue, maxValue);
                const valueY = this.pixelsToValue(mouseY, this.props.height, minValue, maxValue);
                onClick(valueX, valueY);
            }
        }
    }

    handleDoubleClick = (mouseX, mouseY) => {
        const { onDoubleClick } = this.props;
        const { minValue, maxValue } = this.props;

        this.setState(prevState => ({
            isControlMode: !prevState.isControlMode
        }));

        if (onDoubleClick) {
            const valueX = this.pixelsToValue(mouseX, this.props.width, minValue, maxValue);
            const valueY = this.pixelsToValue(mouseY, this.props.height, minValue, maxValue);
            onDoubleClick(valueX, valueY);
        }
    }

    handleContextMenu = (event) => {
        event.preventDefault();
        const { x: mouseX, y: mouseY } = this.getMousePosition(event);
        const { minValue, maxValue, onRightClick } = this.props;

        if (onRightClick) {
            const valueX = this.pixelsToValue(mouseX, this.props.width, minValue, maxValue);
            const valueY = this.pixelsToValue(mouseY, this.props.height, minValue, maxValue);
            onRightClick(valueX, valueY);
        }
    }

    render() {
        const { 
            width = 200, 
            height = 200, 
            circleRadius = 15,
            minValue = -500,
            maxValue = 500,
            className = '',
            style = {}
        } = this.props;

        const { isControlMode, isDragging, circleX, circleY, currentX, currentY } = this.state;

        // Calculate inner rectangle dimensions (where circle center can reach max/min values)
        const valueRange = maxValue - minValue;
        const innerWidth = (valueRange / (valueRange + 2 * circleRadius)) * width;
        const innerHeight = (valueRange / (valueRange + 2 * circleRadius)) * height;
        const innerX = (width - innerWidth) / 2;
        const innerY = (height - innerHeight) / 2;

        return (
            <div 
                className={`d-inline-block ${className}`}
                style={{ 
                    border: isControlMode ? '2px solid #007bff' : '2px solid #6c757d',
                    borderRadius: '4px',
                    backgroundColor: isControlMode ? '#f8f9fa' : '#e9ecef',
                    cursor: isControlMode ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
                    userSelect: 'none',
                    ...style
                }}
            >
                <svg
                    ref={this.svgRef}
                    width={width}
                    height={height}
                    onClick={this.handleClick}
                    onContextMenu={this.handleContextMenu}
                    onMouseDown={this.handleMouseDown}
                    onTouchStart={this.handleMouseDown}
                    style={{ display: 'block' }}
                >
                    {/* Outer rectangle boundary (where circle edge can reach) */}
                    <rect
                        x="0"
                        y="0"
                        width={width}
                        height={height}
                        fill="none"
                        stroke={isControlMode ? '#007bff' : '#6c757d'}
                        strokeWidth="2"
                    />

                    {/* Inner rectangle (where circle center reaches max/min values) */}
                    <rect
                        x={innerX}
                        y={innerY}
                        width={innerWidth}
                        height={innerHeight}
                        fill="none"
                        stroke="#dee2e6"
                        strokeWidth="1"
                        strokeDasharray="3,3"
                    />

                    {/* Center crosshair */}
                    <line
                        x1={width / 2}
                        y1="0"
                        x2={width / 2}
                        y2={height}
                        stroke="#dee2e6"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                    />
                    <line
                        x1="0"
                        y1={height / 2}
                        x2={width}
                        y2={height / 2}
                        stroke="#dee2e6"
                        strokeWidth="1"
                        strokeDasharray="5,5"
                    />

                    {/* Draggable circle */}
                    <circle
                        cx={circleX}
                        cy={circleY}
                        r={circleRadius}
                        fill={isControlMode ? (isDragging ? '#0056b3' : '#007bff') : '#6c757d'}
                        stroke={isControlMode ? '#004085' : '#495057'}
                        strokeWidth="2"
                        style={{
                            filter: isControlMode ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                        }}
                    />

                    {/* Coordinate display */}
                    <text
                        x="10"
                        y={height - 10}
                        fill={isControlMode ? '#007bff' : '#6c757d'}
                        fontSize="12"
                        fontFamily="monospace"
                    >
                        X: {Math.round(currentX)} Y: {Math.round(currentY)}
                    </text>

                    {/* Control mode indicator */}
                    {isControlMode && (
                        <text
                            x="10"
                            y="20"
                            fill="#007bff"
                            fontSize="14"
                            fontWeight="bold"
                        >
                            CONTROL MODE
                        </text>
                    )}

                    {/* Value range indicators */}
                    <text
                        x={width / 2}
                        y={innerY - 5}
                        fill="#6c757d"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {maxValue}
                    </text>
                    <text
                        x={width / 2}
                        y={innerY + innerHeight + 15}
                        fill="#6c757d"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {minValue}
                    </text>
                    <text
                        x={innerX - 15}
                        y={height / 2 + 5}
                        fill="#6c757d"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {minValue}
                    </text>
                    <text
                        x={innerX + innerWidth + 15}
                        y={height / 2 + 5}
                        fill="#6c757d"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {maxValue}
                    </text>
                </svg>
            </div>
        );
    }
}

export default Class_2D_Joystick;
