import React, { useRef, useEffect } from 'react';

const BarChart = ({ data, labels }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Clear the canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate the width and height of each bar
    const barWidth = canvas.width / data.length - 10;
    const maxValue = Math.max(...data);

    // Draw the bars
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * canvas.height;
      const x = index * (barWidth + 10);
      const y = canvas.height - barHeight;

      ctx.fillStyle = 'yellow';
      ctx.fillRect(x, y, barWidth, barHeight);
    });

    // Draw the labels
    const labelWidth = canvas.width / labels.length;
    labels.forEach((label, index) => {
      ctx.save();
      ctx.translate(index * labelWidth + labelWidth / 2, canvas.height-40);
      //ctx.rotate((90 * Math.PI) / 180);
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.fillStyle = 'red';
      ctx.fillText(label, 0, 20);
      ctx.restore();
    });
  }, [data, labels]);

  return (
    <canvas
      ref={canvasRef}
      width={600}
      height={400}
      style={{ border: '1px solid #000' }}
    />
  );
};

export default BarChart;