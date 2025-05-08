/*************************************************************************************
 * 
 *   A N D R U A V - C L I E N T       JAVASCRIPT  LIB
 * 
 *   Author: Mohammad S. Hefny
 * 
 *   Date:   07 Aug 2024
 * 
 * 
 *************************************************************************************/


import React from 'react';



class ClassBarChart extends React.Component {

    constructor(props) {
        super(props);
        this.canvasRef = React.createRef();
        this.m_maxValue = 0;
    }


    // Function to get the color based on the value
    getColor(value) {
        // Ensure the value is within the valid range
        value = parseInt(255 * Math.max(0, Math.min(1, value / this.m_maxValue)));

        // Calculate the red, green, and blue components based on the value
        let r, g, b;
        r = value;
        b = 255 - value;
        g = 0;
        // if (value < 10) {
        //     r = 0;
        //     g = Math.round(255 * (value / 10));
        //     b = 255;
        // } else {
        //     r = Math.round(255 * ((value - 10) / 10));
        //     g = 255;
        //     b = 255 - Math.round(255 * ((value - 10) / 10));
        // }

        // Convert the RGB values to a hexadecimal color code
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }


    componentDidMount() {
        this.drawChart();
    }

    componentDidUpdate() {
        this.drawChart();
    }

    averageArray(data, m) {
        const n = data.length;
        const averagedData = [];
    
        // Calculate the size of each segment
        const segmentSize = Math.floor(n / m);
        
        for (let i = 0; i < m; i++) {
            const start = i * segmentSize; // Start index of the segment
            const end = (i + 1) * segmentSize; // End index of the segment
            const segment = data.slice(start, end); // Slice the segment
    
            // Calculate the average of the segment
            const sum = segment.reduce((acc, value) => acc + value, 0);
            const average = sum / segment.length;
    
            averagedData.push(average);
        }
    
        return averagedData;
    }

    drawChart() {
        const canvas = this.canvasRef.current;
        const ctx = canvas.getContext('2d');

        // Clear the canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Fetch the data and labels
        const { data, labels } = this.props;
        let displayed_data;
        // Calculate the width and height of each bar
        let barWidth = canvas.width / data.length;
        if (barWidth < 1)
        {
            barWidth = 1;
            displayed_data = this.averageArray(data, canvas.width);
        }
        else
        {
            displayed_data = data;
        }
        
        this.m_maxValue = Math.max(...displayed_data);

        const margin = 30;
        const inner_height = canvas.height - (2 * margin);

        // Draw the bars
        displayed_data.forEach((value, index) => {
            const barHeight = (value / this.m_maxValue) * inner_height;
            const x = index * (barWidth);
            const y = inner_height - barHeight + margin;

            ctx.fillStyle = this.getColor(value);
            ctx.fillRect(x, y, barWidth, barHeight);
        });

        // Draw the labels
        const labelWidth = canvas.width / labels.length;
        labels.forEach((label, index) => {
            ctx.save();
            ctx.translate(index * labelWidth + labelWidth / 2, inner_height - 60 + margin);
            ctx.rotate((-90 * Math.PI) / 180);
            ctx.font = 'bold 12px Arial';
            ctx.textAlign = 'center';
            ctx.fillStyle = 'white';
            ctx.fillText(label, 0, 20);
            ctx.restore();
        });

        // Draw the x-axis line
        ctx.beginPath();
        ctx.moveTo(0, inner_height - 15 + margin);
        ctx.lineTo(canvas.width, inner_height - 15 + margin);
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw the x-axis tips
        labels.forEach((label, index) => {
            const x = index * labelWidth + labelWidth / 2;
            ctx.beginPath();
            ctx.moveTo(x, inner_height - 20 + margin );
            ctx.lineTo(x, inner_height - 10 + margin);
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();
        });

        // Draw the vertical line with three tips
        const middleY = inner_height / 2 + margin;
        const maxY =  margin;

        ctx.save();
        ctx.translate(50, 0);
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        ctx.fillStyle = 'white';
        ctx.fillText(parseFloat(this.m_maxValue).toFixed(2), 0, margin);
        ctx.fillText(parseFloat(this.m_maxValue / 2).toFixed(2), 0, inner_height / 2 + margin);
        ctx.restore();

        ctx.beginPath();
        ctx.moveTo(30, middleY);
        ctx.lineTo(10, middleY);
        ctx.moveTo(20, middleY - 5);
        ctx.lineTo(20, middleY + 5);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(30, maxY);
        ctx.lineTo(10, maxY);
        ctx.moveTo(20, maxY - 5);
        ctx.lineTo(20, maxY + 5);
        ctx.stroke();
    }

    render() {
        return (
            <canvas
                ref={this.canvasRef}
                width={600}
                height={400}
                style={{ border: '1px solid #000' }}
            />
        );
    }
}

export default ClassBarChart;
