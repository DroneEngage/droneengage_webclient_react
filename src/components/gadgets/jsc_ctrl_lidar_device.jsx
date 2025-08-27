
import 'jquery-ui-dist/jquery-ui.min.js';

import React    from 'react';

import {Class_Radar_Screen} from '../micro_gadgets/jsc_mctrl_radar_screen.jsx'

import {EVENTS as js_event} from '../../js/js_eventList.js'
import {js_eventEmitter} from '../../js/js_eventEmitter.js'

export class ClssCtrlLidarDevice extends React.Component {
    
    constructor()
	{
		super ();
		    this.state = {
                m_update: 0
		};
        
        this.key = Math.random().toString();
        
        
        js_eventEmitter.fn_subscribe(js_event.EE_andruavUnitLidarInfo,this,this.fn_update_lidar);
    }

    shouldComponentUpdate(nextProps, nextState) {
        // Only re-render if m_update state has changed
        const update = (this.state.m_update !== nextState.m_update);
        return update;
    }
    
    componentDidMount () 
    {
        this.state.m_update = 1;
    }
    
    componentDidUpdate(prevProps) {
        // called  when properties updates i.e. parent called control again.       
    }

    componentWillUnmount () 
    {
        js_eventEmitter.fn_unsubscribe(js_event.EE_andruavUnitLidarInfo,this);
    }

    fn_update_lidar (p_me, p_andruavUnit)
    {
        if (p_me.props === null || p_me.props === undefined) return ;
        if (p_andruavUnit === null || p_andruavUnit === undefined) return ;
        if (p_me.props.p_unit === null || p_me.props.p_unit === undefined) return ;
        if (p_me.props.p_unit.partyID !== p_andruavUnit.partyID) return ;

        if (p_me.state.m_update === 0) return ;

        
        p_me.setState({'m_update': p_me.state.m_update +1});
    }
    
    distanceToRingIndex(distance, maxDistance, numRings) {
        // Clamp the distance to be within the max range
        distance = Math.max(0, Math.min(distance, maxDistance));
    
        // Calculate the distance per ring
        const distancePerRing = maxDistance / numRings;
    
        // Calculate the ring index (1-based)
        const ringIndex = Math.ceil(distance / distancePerRing);
        
        // Ensure the ring index does not exceed the total number of rings
        return Math.min(ringIndex, numRings);
    }
    
    distanceToRGB(distance, minDistance, maxDistance) {
        // Clamp the distance to be within the min and max range
        distance = Math.max(minDistance, Math.min(distance, maxDistance));
    
        // Normalize the distance to a value between 0 and 1
        const normalized = (distance - minDistance) / (maxDistance - minDistance);
    
        // Calculate the RGB values
        const blue = Math.round(255 * normalized);   // From 0 to 255
        const red = Math.round(255 * (1 - normalized)); // From 255 to 0
    
        return `rgb(${red}, 0, ${blue})`;
    }
    
    render ()
    {

        let obstacles = [];
        let rotation = 0;
        const ranges = 10;
            
        if (this.props.p_unit !== null && this.props.p_unit !== undefined)
        {
            
            const distance_sensors = this.props.p_unit.m_lidar_info.m_distance_sensors;

            if (this.props.follow_unit === true)
            {
                rotation = this.props.p_unit.m_Nav_Info.p_Orientation.yaw;
            }

            for (let i=0; i<=7;++i)
            {
                const degree_45 = distance_sensors[i];
                if (degree_45.m_isValid === true)
                {
                    const color = this.distanceToRGB (degree_45.m_current_distance,
                        degree_45.m_min_distance,
                        degree_45.m_max_distance);
                    const depth = this.distanceToRingIndex (degree_45.m_current_distance,
                        degree_45.m_max_distance, ranges);
                    obstacles.push([i+1, depth, color]);
                }
            }
            
        }

        let ticks = (1 + this.props.rotation_ticks % 16);

        
        
            

        return (
            
        <Class_Radar_Screen sections={8} depth={ranges+1} follow_unit={this.props.follow_unit} rotation_steps={ticks} rotation={rotation} highlighted_points={obstacles} draw_pointer/>

        );
    }

    
}