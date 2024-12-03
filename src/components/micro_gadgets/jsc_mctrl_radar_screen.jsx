import React from 'react';

import * as js_helpers from '../../js/js_helpers.js'

/**
 * This is a GUI control that displays a radar-like screen 
 * and can highlight any area on this grid.
 * 
 * sections= number of rays.
 * depth= number of circles.
 * rotation_steps= each step is between two rays.
 * rotation= free rotation in radius.
 * highlighted_points= [[section,depth,color],...]
 * [draw_pointer]
 */
export class Class_Radar_Screen extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
    this.hasDrawn = false; // Flag to check if radar has been drawn
    this.angleInRadians = 0;
  }

  componentDidMount() {
    // Calculate the angle for radar rotation based on props
    this.angleInRadians = (this.props.rotation_steps * Math.PI) / this.props.sections  + this.props.rotation;
    
    this.drawRadar();
    this.highlightSection([[3, 2, '#ff0000'], [5, 4, '#00ff00']]);
    this.highlightSection(this.props.highlighted_points);
  }

  componentDidUpdate(prevProps) {
    // Calculate the angle for radar rotation based on props
    this.angleInRadians = (this.props.rotation_steps * Math.PI) / this.props.sections  + this.props.rotation;
    
    // Redraw only if the sections or depth have changed
    if (prevProps.sections !== this.props.sections || prevProps.depth !== this.props.depth) {
      this.drawRadar();
    }
    this.highlightSection(this.props.highlighted_points);
  }

  drawRadar = () => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.8; // 0.8 padding with canvas
  
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
  
    // Save the current state
    ctx.save();

    // Adjust the angle for drawing radar rays
    const angleInRadians_radar_rays = this.angleInRadians - Math.PI / this.props.sections; 

    // Move the context to the center and apply rotation
    ctx.translate(centerX, centerY); // Move to the center of the canvas
    ctx.rotate(angleInRadians_radar_rays); // Rotate the canvas so that everything rotates together.

    // Draw the radar-like grid
    ctx.beginPath();
    for (let i = 1; i <= this.props.sections; i++) {
      const angle = (js_helpers.CONST_PTx2 * i) / this.props.sections;
      const x = radius * Math.cos(angle);
      const y = radius * Math.sin(angle);
      ctx.moveTo(0, 0);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'green';
    ctx.stroke(); // Render the lines
  
    // Draw concentric circles representing depth
    for (let i = 1; i <= this.props.depth; i++) {
      const r = radius * (i / this.props.depth);
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, js_helpers.CONST_PTx2);
      ctx.strokeStyle = 'green';
      ctx.stroke(); // Render the circle
    }
  
    if (this.props.draw_pointer === true)
    {
      // Draw the north arrow at the top of the radar
      this.drawNorthArrow(radius);
    }

    // Restore the original state
    ctx.restore();
  };

  drawNorthArrow = (radius) => {
    const ctx = this.canvasRef.current.getContext('2d');

    const arrowHeight = 20;
    const arrowBaseWidth = 10;

    // Calculate the points for the triangle
    const top = {
      x: 0,
      y: -radius - arrowHeight,
    };
    const left = {
      x: -arrowBaseWidth / 2,
      y: -radius,
    };
    const right = {
      x: arrowBaseWidth / 2,
      y: -radius,
    };

    // Draw the arrow
    ctx.beginPath();
    ctx.moveTo(top.x, top.y);
    ctx.lineTo(left.x, left.y);
    ctx.lineTo(right.x, right.y);
    ctx.closePath();
    ctx.fillStyle = 'yellow';
    ctx.fill();
  };

  highlightSection = (points) => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.8; // 0.8 padding with canvas
  
    // Clear the previously highlighted sections
    ctx.clearRect(0, 0, width, height);
  
    // Draw the radar-like grid
    this.drawRadar();
  
    if (points === null || points === undefined) return;
    
    // Handle single points and arrays of points
    const pointsToHighlight = Array.isArray(points) ? points : [points];
  
    
    // Highlight the sections based on the provided points
    pointsToHighlight.forEach(([n, m, color]) => {
      // Calculate the start and end angles for the highlighted section
      const startAngle = (js_helpers.CONST_PTx2 * (n - 2)) / this.props.sections - Math.PI / 2 +  this.angleInRadians;
      const endAngle = (js_helpers.CONST_PTx2 * (n -1)) / this.props.sections - Math.PI / 2 + this.angleInRadians;
      let innerRadius = radius * ((m - 2) / this.props.depth);
      let outerRadius = radius * ((m - 1) / this.props.depth);
      innerRadius = Math.max(0,innerRadius);
      outerRadius = Math.max(0,outerRadius);
      
      // Calculate the intersection points of the highlighted section
      const topLeft = {
        x: centerX + innerRadius * Math.cos(startAngle),
        y: centerY + innerRadius * Math.sin(startAngle),
      };
      const topRight = {
        x: centerX + outerRadius * Math.cos(startAngle),
        y: centerY + outerRadius * Math.sin(startAngle),
      };
      const bottomRight = {
        x: centerX + outerRadius * Math.cos(endAngle),
        y: centerY + outerRadius * Math.sin(endAngle),
      };
      const bottomLeft = {
        x: centerX + innerRadius * Math.cos(endAngle),
        y: centerY + innerRadius * Math.sin(endAngle),
      };
  
      // Ensure the highlighted section doesn't touch the boundaries
      const padding = 10; // 10-pixel padding from each boundary
      if (topLeft.x < padding) {
        topLeft.x = padding;
        bottomLeft.x = padding;
      }
      if (topLeft.y < padding) {
        topLeft.y = padding;
        topRight.y = padding;
      }
      if (topRight.x > width - padding) {
        topRight.x = width - padding;
        bottomRight.x = width - padding;
      }
      if (bottomRight.y > height - padding) {
        bottomRight.y = height - padding;
        bottomLeft.y = height - padding;
      }
  
      // Draw the highlighted section
      ctx.beginPath();
      ctx.moveTo(topLeft.x, topLeft.y);
      ctx.lineTo(topRight.x, topRight.y);
      ctx.arc(centerX, centerY, outerRadius, startAngle, endAngle);
      ctx.lineTo(bottomRight.x, bottomRight.y);
      ctx.arc(centerX, centerY, innerRadius, endAngle, startAngle, true);
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();


      // Draw the radius value in the center of the highlighted area
    const distanceText = outerRadius.toFixed(0) + ' m'; // Use outer radius for the distance value
    ctx.fillStyle = 'white'; // Set text color
    ctx.font = '12px Arial'; // Set font style

    // Calculate the position for the distance text
    const textAngle = (startAngle + endAngle) / 2; // Midpoint angle for placing the text
    const textX = centerX + (outerRadius + 10) * Math.cos(textAngle); // Positioning text slightly outside the outer radius
    const textY = centerY + (outerRadius + 10) * Math.sin(textAngle);

    ctx.fillText(distanceText, textX, textY); // Draw the distance value
    });
  };

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        width={400}
        height={400}
        style={{ width: '100%', height: 'auto' }}
      />
    );
  }
}