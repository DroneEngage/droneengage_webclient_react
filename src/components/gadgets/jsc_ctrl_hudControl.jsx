import $ from 'jquery'; 
import React    from 'react';

export class ClssCTRL_HUD extends React.Component {

    constructor(props)
	{
		super (props);
		    this.state = {
		};
    }

    draw (p_pitch_deg, p_roll_deg, p_yaw_deg) 
    {
        const c_canvas=$('#' + this.props.id + ' #ctrl_hud')[0];
        const c_ctx = c_canvas.getContext('2d');
        c_canvas.width  = 50;
        c_canvas.height = 50; 
        c_canvas.style.width  = '50px';
        c_canvas.style.height = '50px';

        var centerX = c_canvas.width / 2;
        var centerY = c_canvas.height / 2;
        var radius = 22;
        p_pitch_deg = 2 * p_pitch_deg;
        var v_pitch = p_pitch_deg * Math.PI / 180;
        var v_roll = -p_roll_deg * Math.PI / 180;

        var v_pitch_start = v_pitch;
        var v_pitch_end = 3.14 - v_pitch_start;
        
        var v_yaw_start = (p_yaw_deg-3-90)* Math.PI / 180;
        var v_yaw_end = (p_yaw_deg+3-90)* Math.PI / 180;
        
        

        c_ctx.clearRect(0, 0, c_canvas.width, c_canvas.height);
        c_ctx.beginPath();
        c_ctx.lineWidth = 1;
        c_ctx.save();

        // rotate apply roll
        c_ctx.translate(centerX, centerY);
        c_ctx.rotate(v_roll);
        c_ctx.translate(-centerX, -centerY);
        
        // SKY
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, 0 , 6.28);
        c_ctx.fillStyle = '#75a4d3';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = '#2cb1e1';
        c_ctx.stroke();

        // Ground
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, v_pitch_start, v_pitch_end, false);
        c_ctx.fillStyle = '#75D375';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = '#36AB36';
        c_ctx.stroke();

        

        // Yaw
        c_ctx.beginPath();
        c_ctx.moveTo(centerX,centerY);
        c_ctx.arc(centerX, centerY, radius, v_yaw_start, v_yaw_end, false);
        c_ctx.fillStyle = '#F3DBE3';
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = '#F3DBE3';
        c_ctx.closePath();
        c_ctx.stroke();


        c_ctx.restore();

        c_ctx.beginPath();
        c_ctx.moveTo(5,centerY);
        c_ctx.lineTo(c_canvas.width-5, centerY);
        c_ctx.lineWidth = 1;
        c_ctx.fillStyle = '#F0AD4E';
        c_ctx.stroke();

        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, 2, 0, 2*Math.PI, false);
        c_ctx.fillStyle = '#DA7EB7';
        c_ctx.fill();
        c_ctx.lineWidth = 2;
        c_ctx.strokeStyle = '#DA7EB7';
        c_ctx.stroke();
        
    }

    componentDidMount() {
        this.draw(this.props.v_pitch,this.props.v_roll,this.props.v_yaw,this.props.v_target);
    }

    componentDidUpdate() {
        this.draw(this.props.v_pitch,this.props.v_roll,this.props.v_yaw,this.props.v_target);
    }

    render ()
    {
        return (
            <div id={this.props.id} className='css_hud_div'>
                <div className = 'row al_l css_margin_zero'>
                    <div className= 'col-6  css_margin_zero d-flex '>
                        <ul className ='css_hud_bullets'>
                            <li><span className='text-white'>R:</span><span className='text-warning'>{this.props.v_roll}º</span></li>
                            <li><span className='text-white'>P:</span><span className='text-warning'>{this.props.v_pitch}º</span></li>
                            <li><span className='text-white'>Y:</span><span className='text-warning'>{this.props.v_yaw}º</span></li>
                        </ul>
                    </div>

                    <div className= 'col-6  css_margin_zero css_padding_zero'>
                    <canvas id='ctrl_hud' className='css_hud'></canvas>
                    </div>
                   
                </div>
            </div>
        )
    }

}