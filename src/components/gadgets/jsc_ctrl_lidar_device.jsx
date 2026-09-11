
import 'jquery-ui-dist/jquery-ui.min.js';

import React from 'react';

import {Class_Radar_Screen} from '../micro_gadgets/jsc_mctrl_radar_screen.jsx'

import { useUnitField } from '../../js/hooks/useUnitField.js'

function distanceToRingIndex(distance, maxDistance, numRings) {
    // Clamp the distance to be within the max range
    distance = Math.max(0, Math.min(distance, maxDistance));

    // Calculate the distance per ring
    const distancePerRing = maxDistance / numRings;

    // Calculate the ring index (1-based)
    const ringIndex = Math.ceil(distance / distancePerRing);

    // Ensure the ring index does not exceed the total number of rings
    return Math.min(ringIndex, numRings);
}

function distanceToRGB(distance, minDistance, maxDistance) {
    // Clamp the distance to be within the min and max range
    distance = Math.max(minDistance, Math.min(distance, maxDistance));

    // Normalize the distance to a value between 0 and 1
    const normalized = (distance - minDistance) / (maxDistance - minDistance);

    // Calculate the RGB values
    const blue = Math.round(255 * normalized);   // From 0 to 255
    const red = Math.round(255 * (1 - normalized)); // From 255 to 0

    return `rgb(${red}, 0, ${blue})`;
}

export function ClssCtrlLidarDevice({ p_unit, follow_unit, rotation_ticks }) {
    // Field-granular re-render: only re-render when this unit's distance
    // sensors or heading change, not on every coarse EE_andruavUnitLidarInfo
    // for the whole unit. m_lidar_info.update() is a legacy direct mutation
    // (js_andruav_parser.js), so that call site notifies this field manually.
    const _partyId = p_unit?.getPartyID();
    useUnitField(_partyId, 'm_lidar_info.m_distance_sensors');
    useUnitField(_partyId, 'm_Nav_Info.p_Orientation.yaw');

    let obstacles = [];
    let rotation = 0;
    const ranges = 10;

    if (p_unit !== null && p_unit !== undefined)
    {
        const distance_sensors = p_unit.m_lidar_info.m_distance_sensors;

        if (follow_unit === true)
        {
            rotation = p_unit.m_Nav_Info.p_Orientation.yaw;
        }

        for (let i=0; i<=7;++i)
        {
            const degree_45 = distance_sensors[i];
            if (degree_45.m_isValid === true)
            {
                const color = distanceToRGB(degree_45.m_current_distance,
                    degree_45.m_min_distance,
                    degree_45.m_max_distance);
                const depth = distanceToRingIndex(degree_45.m_current_distance,
                    degree_45.m_max_distance, ranges);
                obstacles.push([i+1, depth, color]);
            }
        }
    }

    let ticks = (1 + rotation_ticks % 16);

    return (
        <Class_Radar_Screen sections={8} depth={ranges+1} follow_unit={follow_unit} rotation_steps={ticks} rotation={rotation} highlighted_points={obstacles} draw_pointer/>
    );
}
