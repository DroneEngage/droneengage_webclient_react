import React from 'react';


/**
 * This is a GUI control that display a rader-like screen 
 * and can highlight any area on this grid.
 */
export class Class_Radar_Screen extends React.Component {
  constructor(props) {
    super(props);
    this.canvasRef = React.createRef();
  }

  componentDidMount() {
    this.drawRadar();
    this.highlightSection([[3, 2, '#ff0000'], [5, 4, '#00ff00']]);
    this.highlightSection(this.props.highlighted_points);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.N !== this.props.N || prevProps.M !== this.props.M) {
      this.drawRadar();
      //this.highlightSection([[3, 2, '#ff0000'], [5, 4, '#00ff00']]);
      this.highlightSection(prevProps.highlighted_points);
    }
  }

  drawRadar = () => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.8;   // 0.8 padding with canvas
  
    // Clear the canvas
    ctx.clearRect(0, 0, width, height);
  
    // Draw the radar-like grid
    ctx.beginPath();
    for (let i = 1; i <= this.props.N; i++) {
      const angle = (2 * Math.PI * i) / this.props.N;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = 'white';
    ctx.stroke();
  
    for (let i = 1; i <= this.props.M; i++) {
      const r = radius * (i / this.props.M);
      ctx.beginPath();
      ctx.arc(centerX, centerY, r, 0, 2 * Math.PI);
      ctx.strokeStyle = 'white';
      ctx.stroke();
    }
  };

  highlightSection = (points) => {
    const canvas = this.canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 * 0.8;   // 0.8 padding with canvas
  
    // Clear the previously highlighted sections
    ctx.clearRect(0, 0, width, height);
  
    // Draw the radar-like grid
    this.drawRadar();
  
    // Handle single points and arrays of points
    const pointsToHighlight = Array.isArray(points) ? points : [points];
  
    // Highlight the sections based on the provided points
    pointsToHighlight.forEach(([n, m, color]) => {
      // Calculate the start and end angles for the highlighted section
      const startAngle = (2 * Math.PI * (n - 1)) / this.props.N;
      const endAngle = (2 * Math.PI * n) / this.props.N;
      const innerRadius = radius * ((m - 1) / this.props.M);
      const outerRadius = radius * (m / this.props.M);
  
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
    });
  };

  render() {
    return (
      <canvas
        ref={this.canvasRef}
        width={400}
        height={400}
        style={{ width: '50%', height: 'auto' }}
      />
    );
  }
}