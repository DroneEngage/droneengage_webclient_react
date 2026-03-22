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
 * - rangeX: X-axis range (default: 500)
 * - rangeY: Y-axis range (default: 500)
 * - labelX: X-axis label (default: 'X')
 * - labelY: Y-axis label (default: 'Y')
 * - circleRadius: Radius of draggable circle in pixels (default: 15)
 * - initialX: Initial X value (default: 0)
 * - initialY: Initial Y value (default: 0)
 * - currentX: Current X value for programmatic control (overrides internal state)
 * - currentY: Current Y value for programmatic control (overrides internal state)
 * - sendOnReleaseOnly: Only fire onDrag event on mouse/touch release (default: false)
 * - mode: Operating mode - 'location' (default) or 'motion'
 * - indicatorCircle: Object with x, y, rgb properties for non-draggable indicator circle
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
            rangeX = 500,
            rangeY = 500,
            labelX = 'X',
            labelY = 'Y',
            circleRadius = 15,
            initialX = 0,
            initialY = 0,
            mode = 'location'
        } = props;

        // Calculate min/max values from ranges
        const minValueX = -rangeX;
        const maxValueX = rangeX;
        const minValueY = -rangeY;
        const maxValueY = rangeY;

        this.state = {
            isControlMode: false,
            isDragging: false,
            circleX: this.valueToPixels(initialX, width, minValueX, maxValueX),
            circleY: this.valueToPixels(initialY, height, minValueY, maxValueY),
            currentX: initialX,
            currentY: initialY,
            pendingX: null,
            pendingY: null,
            mode: mode
        };

        this.svgRef = React.createRef();
        this.lastClickTime = 0;
        this.dragOffset = { x: 0, y: 0 };
    }

    getMode = () => {
        return this.state.mode;
    }

    resetToCenter = () => {
        const { width = 200, height = 200, rangeX = 500, rangeY = 500 } = this.props;
        const minValueX = -rangeX;
        const maxValueX = rangeX;
        const minValueY = -rangeY;
        const maxValueY = rangeY;

        // Calculate center position (value 0,0)
        const centerCircleX = this.valueToPixels(0, width, minValueX, maxValueX);
        const centerCircleY = this.valueToPixels(0, height, minValueY, maxValueY);

        this.setState({
            circleX: centerCircleX,
            circleY: centerCircleY,
            currentX: 0,
            currentY: 0,
            pendingX: null,
            pendingY: null
        });
    }

    componentDidUpdate(prevProps) {
        // Update mode if prop changes
        if (prevProps.mode !== this.props.mode) {
            this.setState({ mode: this.props.mode });
        }

        // Reset position if initialX or initialY props change
        if (prevProps.initialX !== this.props.initialX || prevProps.initialY !== this.props.initialY) {
            // Avoid interfering during drag or when values are effectively unchanged
            if (this.state.isDragging) return;

            const { initialX = 0, initialY = 0, width = 200, height = 200, rangeX = 500, rangeY = 500 } = this.props;
            const minValueX = -rangeX;
            const maxValueX = rangeX;
            const minValueY = -rangeY;
            const maxValueY = rangeY;

            const eps = 1e-6;
            const sameX = Math.abs((this.state.currentX ?? 0) - initialX) < eps;
            const sameY = Math.abs((this.state.currentY ?? 0) - initialY) < eps;
            if (sameX && sameY) {
                // No-op if values are already at desired target
                return;
            }

            this.setState({
                circleX: this.valueToPixels(initialX, width, minValueX, maxValueX),
                circleY: this.valueToPixels(initialY, height, minValueY, maxValueY),
                currentX: initialX,
                currentY: initialY,
                pendingX: null,
                pendingY: null
            });
        }

        // Update position if currentX or currentY props change (programmatic control)
        if (prevProps.currentX !== this.props.currentX || prevProps.currentY !== this.props.currentY) {
            const { currentX, currentY, width = 200, height = 200, rangeX = 500, rangeY = 500 } = this.props;
            const minValueX = -rangeX;
            const maxValueX = rangeX;
            const minValueY = -rangeY;
            const maxValueY = rangeY;
            
            // Only update if props are provided (not undefined) AND different from current state
            if (currentX !== undefined && currentY !== undefined && 
                (currentX !== this.state.currentX || currentY !== this.state.currentY)) {
                this.setState({
                    circleX: this.valueToPixels(currentX, width, minValueX, maxValueX),
                    circleY: this.valueToPixels(currentY, height, minValueY, maxValueY),
                    currentX: currentX,
                    currentY: currentY
                });
            }
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
        
        // Calculate inner rectangle dimensions (independent of value range)
        const innerDimension = Math.max(0, dimension - 2 * circleRadius);
        const innerOffset = circleRadius;
        
        // Map value to inner rectangle, then add offset
        const innerPosition = ((value - minValue) / valueRange) * innerDimension;
        return innerPosition + innerOffset;
    }

    pixelsToValue = (pixels, dimension, minValue, maxValue) => {
        // Convert pixel coordinates to value range, accounting for inner rectangle
        const valueRange = maxValue - minValue;
        const circleRadius = this.props.circleRadius || 15;
        
        // Calculate inner rectangle dimensions (independent of value range)
        const innerDimension = Math.max(0, dimension - 2 * circleRadius);
        const innerOffset = circleRadius;
        
        // Convert to inner rectangle coordinates, then to value
        const innerPosition = pixels - innerOffset;
        const value = (innerPosition / innerDimension) * valueRange + minValue;
        
        // Return float with natural pixel-based resolution (no forced rounding)
        return value;
    }

    isPointInCircle = (mouseX, mouseY, circleX, circleY, radius) => {
        const distance = Math.sqrt(Math.pow(mouseX - circleX, 2) + Math.pow(mouseY - circleY, 2));
        return distance <= radius;
    }

    constrainToRectangle = (x, y, width, height, radius) => {
        // Allow circle center to reach inner rectangle edges for max/min values
        // but keep circle edge within outer rectangle bounds
        const innerWidth = Math.max(0, width - 2 * radius);
        const innerHeight = Math.max(0, height - 2 * radius);
        const innerX = radius;
        const innerY = radius;
        
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

        const { width, height, rangeX = 500, rangeY = 500, circleRadius, onDrag, sendOnReleaseOnly = false } = this.props;
        const { x: mouseX, y: mouseY } = this.getMousePosition(event);

        // Calculate min/max values from ranges
        const minValueX = -rangeX;
        const maxValueX = rangeX;
        const minValueY = -rangeY;
        const maxValueY = rangeY;

        // Calculate new circle position with drag offset
        let newCircleX = mouseX - this.dragOffset.x;
        let newCircleY = mouseY - this.dragOffset.y;

        // Constrain to rectangle bounds
        const constrained = this.constrainToRectangle(newCircleX, newCircleY, width, height, circleRadius);
        newCircleX = constrained.x;
        newCircleY = constrained.y;

        // Convert to value range
        const valueX = this.pixelsToValue(newCircleX, width, minValueX, maxValueX);
        const valueY = this.pixelsToValue(newCircleY, height, minValueY, maxValueY);

        this.setState({
            circleX: newCircleX,
            circleY: newCircleY,
            currentX: valueX,
            currentY: valueY,
            pendingX: sendOnReleaseOnly ? valueX : null,
            pendingY: sendOnReleaseOnly ? valueY : null
        });

        // Handle different modes
        if (this.state.mode === 'motion') {
            // In motion mode, fire events continuously while dragging
            if (onDrag) {
                onDrag(valueX, valueY);
            }
        } else {
            // In location mode, fire onDrag event immediately if not sendOnReleaseOnly
            if (onDrag && !sendOnReleaseOnly) {
                onDrag(valueX, valueY);
            }
        }
    }

    handleGlobalMouseUp = (event) => {
        if (!this.state.isDragging) return;

        const { onRelease, onDrag, sendOnReleaseOnly = false } = this.props;
        const { currentX, currentY, pendingX, pendingY } = this.state;

        // Just set isDragging to false, don't reset pending values
        this.setState({ 
            isDragging: false
        });

        if (onRelease) {
            onRelease(currentX, currentY);
        }

        // Handle different modes
        if (this.state.mode === 'motion') {
            // In motion mode, reset to center and send center event
            this.resetToCenter();
            if (onDrag) {
                onDrag(0, 0); // Send center position event
            }
        } else {
            // In location mode, fire onDrag event on release if sendOnReleaseOnly is true
            if (onDrag && sendOnReleaseOnly && (pendingX !== null || pendingY !== null)) {
                onDrag(pendingX, pendingY);
            }
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
        const { rangeX = 500, rangeY = 500, onClick } = this.props;
        const { isControlMode } = this.state;

        if (isControlMode) return; // Don't handle clicks when in control mode

        const currentTime = Date.now();
        const timeDiff = currentTime - this.lastClickTime;

        if (timeDiff < 300) { // Double click detected
            this.handleDoubleClick(mouseX, mouseY);
        } else {
            this.lastClickTime = currentTime;
            
            if (onClick) {
                const minValueX = -rangeX;
                const maxValueX = rangeX;
                const minValueY = -rangeY;
                const maxValueY = rangeY;
                
                const valueX = this.pixelsToValue(mouseX, this.props.width, minValueX, maxValueX);
                const valueY = this.pixelsToValue(mouseY, this.props.height, minValueY, maxValueY);
                onClick(valueX, valueY);
            }
        }
    }

    handleDoubleClick = (mouseX, mouseY) => {
        const { onDoubleClick, rangeX = 500, rangeY = 500 } = this.props;
        const minValueX = -rangeX;
        const maxValueX = rangeX;
        const minValueY = -rangeY;
        const maxValueY = rangeY;

        this.setState(prevState => ({
            isControlMode: !prevState.isControlMode
        }));

        if (onDoubleClick) {
            const valueX = this.pixelsToValue(mouseX, this.props.width, minValueX, maxValueX);
            const valueY = this.pixelsToValue(mouseY, this.props.height, minValueY, maxValueY);
            onDoubleClick(valueX, valueY);
        }
    }

    handleContextMenu = (event) => {
        event.preventDefault();
        const { x: mouseX, y: mouseY } = this.getMousePosition(event);
        const { rangeX = 500, rangeY = 500, onRightClick } = this.props;
        const minValueX = -rangeX;
        const maxValueX = rangeX;
        const minValueY = -rangeY;
        const maxValueY = rangeY;
        
        if (onRightClick) {
            const valueX = this.pixelsToValue(mouseX, this.props.width, minValueX, maxValueX);
            const valueY = this.pixelsToValue(mouseY, this.props.height, minValueY, maxValueY);
            onRightClick(valueX, valueY);
        }
    }

    render() {
        const { 
            width = 200, 
            height = 200, 
            rangeX = 500,
            rangeY = 500,
            labelX = 'X',
            labelY = 'Y',
            circleRadius = 15,
            indicatorCircle = null,
            className = '',
            style = {}
        } = this.props;

        const { isControlMode, isDragging, circleX, circleY, currentX, currentY, mode } = this.state;

        // Determine colors based on mode
        const isMotionMode = mode === 'motion';
        const primaryColor = isMotionMode ? '#dc3545' : '#007bff'; // Red for motion, Blue for location
        const secondaryColor = isMotionMode ? '#a02633' : '#004085'; // Darker shades
        const bgColor = isControlMode ? '#f8f9fa' : '#e9ecef';

        // Calculate min/max values from ranges
        const minValueX = -rangeX;
        const maxValueX = rangeX;
        const minValueY = -rangeY;
        const maxValueY = rangeY;

        // Inner rectangle (region the circle center can travel): purely geometry-based
        const innerWidth = Math.max(0, width - 2 * circleRadius);
        const innerHeight = Math.max(0, height - 2 * circleRadius);
        const innerX = circleRadius;
        const innerY = circleRadius;

        // Calculate indicator circle position if provided
        let indicatorCircleX = null;
        let indicatorCircleY = null;
        if (indicatorCircle && indicatorCircle.x !== undefined && indicatorCircle.y !== undefined) {
            indicatorCircleX = this.valueToPixels(indicatorCircle.x, width, minValueX, maxValueX);
            indicatorCircleY = this.valueToPixels(indicatorCircle.y, height, minValueY, maxValueY);
        }

        return (
            <div 
                className={`d-inline-block ${className}`}
                style={{ 
                    border: isControlMode ? `2px solid ${primaryColor}` : '2px solid #6c757d',
                    borderRadius: '4px',
                    backgroundColor: bgColor,
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
                        stroke={isControlMode ? primaryColor : '#6c757d'}
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

                    {/* Indicator Circle (non-draggable) */}
                    {indicatorCircleX !== null && indicatorCircleY !== null && (
                        <circle
                            cx={indicatorCircleX}
                            cy={indicatorCircleY}
                            r={circleRadius}
                            fill={indicatorCircle.rgb || '#ff0000'}
                            fillOpacity="0.3"
                            stroke={indicatorCircle.rgb || '#ff0000'}
                            strokeWidth="2"
                            strokeDasharray="5,5"
                            style={{ pointerEvents: 'none' }} // Make it non-interactive
                        />
                    )}

                    {/* Draggable circle */}
                    <circle
                        cx={circleX}
                        cy={circleY}
                        r={circleRadius}
                        fill={isControlMode ? (isDragging ? secondaryColor : primaryColor) : '#6c757d'}
                        stroke={isControlMode ? secondaryColor : '#495057'}
                        strokeWidth="2"
                        style={{
                            filter: isControlMode ? 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' : 'none'
                        }}
                    />

                    {/* Coordinate display */}
                    <text
                        x="10"
                        y={height - 20}
                        fill={isControlMode ? primaryColor : '#6c757d'}
                        fontSize="12"
                        fontFamily="monospace"
                    >
                        {labelX}: {Number.isFinite(currentX) ? currentX.toFixed(2) : currentX}
                    </text>
                    <text
                        x="10"
                        y={height - 5}
                        fill={isControlMode ? primaryColor : '#6c757d'}
                        fontSize="12"
                        fontFamily="monospace"
                    >
                        {labelY}: {Number.isFinite(currentY) ? currentY.toFixed(2) : currentY}
                    </text>

                    {/* Control mode indicator */}
                    {isControlMode && (
                        <text
                            x="10"
                            y="20"
                            fill={primaryColor}
                            fontSize="14"
                            fontWeight="bold"
                        >
                            {isMotionMode ? 'MOTION MODE' : 'LOCATION MODE'}
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
                        {maxValueY}
                    </text>
                    <text
                        x={width / 2}
                        y={innerY + innerHeight + 15}
                        fill="#6c757d"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {minValueY}
                    </text>
                    <text
                        x={innerX - 15}
                        y={height / 2 + 5}
                        fill="#6c757d"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {minValueX}
                    </text>
                    <text
                        x={innerX + innerWidth + 15}
                        y={height / 2 + 5}
                        fill="#6c757d"
                        fontSize="10"
                        textAnchor="middle"
                    >
                        {maxValueX}
                    </text>
                </svg>
            </div>
        );
    }
}

export default Class_2D_Joystick;
