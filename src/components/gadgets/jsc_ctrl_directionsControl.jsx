import $ from 'jquery'; 
import React    from 'react';

export class Clss_CTRL_DIRECTIONS extends React.Component {

    constructor()
	{
		super ();
		    this.state = {
		};
    }

    

    draw (target_deg, bearing_deg) 
    {
        //fn_console_log ("target_deg:"+ target_deg + " bearing_deg:" + bearing_deg);
        const c_canvas=$('#' + this.props.id +' #ctrl_target_bearing')[0];
        const c_ctx = c_canvas.getContext('2d');
        
        c_canvas.width  = 50;
        c_canvas.height = 50; 
        c_canvas.style.width  = '50px';
        c_canvas.style.height = '50px';

        var centerX = c_canvas.width / 2;
        var centerY = c_canvas.height / 2;
        var radius = 22;
        
        var v_target_start = (target_deg-4-90)* Math.PI / 180;
        var v_target_end = (target_deg+4-90)* Math.PI / 180;
        

        var v_bearing_start = (bearing_deg-3-90)* Math.PI / 180;
        var v_bearing_end = (bearing_deg+3-90)* Math.PI / 180;
        

        c_ctx.clearRect(0, 0, c_canvas.width, c_canvas.height);
        

        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
        c_ctx.lineWidth = 3;
        c_ctx.strokeStyle = '#2cb1e1';
        c_ctx.stroke();
        
        
        

        // 1- Bearing
        c_ctx.beginPath();
        c_ctx.moveTo(centerX,centerY);
        c_ctx.arc(centerX, centerY, radius, v_bearing_start, v_bearing_end, false);
        c_ctx.fillStyle = '#36AB36';
        c_ctx.fill();
        c_ctx.lineWidth = 1;
        c_ctx.strokeStyle = '#36AB36';
        c_ctx.closePath();
        c_ctx.stroke();


        // 2- Target to override tip of bearing
        c_ctx.beginPath();
        c_ctx.arc(centerX, centerY, radius, v_target_start, v_target_end, false);
        c_ctx.lineWidth = 3;
        c_ctx.fillStyle = '#FFFFFF';
        c_ctx.strokeStyle = '#FFFFFF';
        c_ctx.closePath();
        c_ctx.stroke();


    }


    componentDidMount() {
        this.draw(this.props.v_target,this.props.v_bearing);
    }

    componentDidUpdate() {
        this.draw(this.props.v_target,this.props.v_bearing);
    }

    render ()
    {
        return (
            <div  id={this.props.id}  className='css_hud_div'>
                <div className = 'row al_l css_margin_zero'>
                    <canvas id='ctrl_target_bearing' className='css_target_bearing'></canvas>
                </div>
            </div>
        )
    }
}