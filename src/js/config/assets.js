// Icon path arrays, colour arrays, and dialog icon glyphs.
// Frozen — pure data, never mutated at runtime.
export const planes_icon = [
	'/images/planetracker_r_0d_.png',
	'/images/planetracker_y_0d_.png',
	'/images/planetracker_g_0d_.png',
	'/images/planetracker_b_0d_.png',
];

export const quad_icon = [
	'/images/drone_qq_1_0d.png',
	'/images/drone_qq_2_0d.png',
	'/images/drone_qq_3_0d.png',
	'/images/drone_qq_4_0d.png',
];

// 3D glb color mapping for the quad variants. The 3D map (js_map3d.js
// fn_syncUnitModel) picks a glb per unit by `m_index % 4` — the same
// index used to pick the 2D quad_icon PNG above — so each 3D variant is
// the 3D counterpart of its 2D icon. These hex colors are the ones baked
// into public/models/quad[_1..4].glb by scripts/generate_quad_glb.js
// (body / rear rotors / front rotors / chassis). Front rotors are white
// across all variants to mark the drone's forward direction. Regenerate
// the .glb files with these colors if the 2D icons ever change.
//   idx 0 → quad.glb   (default, no 2D counterpart)
//   idx 1 → quad_1.glb (matches drone_qq_1_0d.png)
//   idx 2 → quad_2.glb (matches drone_qq_2_0d.png)
//   idx 3 → quad_3.glb (matches drone_qq_3_0d.png)
//   idx 4 → quad_4.glb (matches drone_qq_4_0d.png)
export const quad_glb_colors = [
	{ body: '#6c6c73', rearRotors: '#ed6150', frontRotors: '#ffffff', chassis: '#6c6c73' }, // quad.glb
	{ body: '#36ab36', rearRotors: '#36ab36', frontRotors: '#ffffff', chassis: '#3671ab' }, // quad_1.glb
	{ body: '#f65353', rearRotors: '#f65353', frontRotors: '#ffffff', chassis: '#36ab36' }, // quad_2.glb
	{ body: '#3671ab', rearRotors: '#3671ab', frontRotors: '#ffffff', chassis: '#f65353' }, // quad_3.glb
	{ body: '#f65353', rearRotors: '#f65353', frontRotors: '#ffffff', chassis: '#7584d3' }, // quad_4.glb
];

export const rover_icon = [
	'/images/car1.png',
	'/images/car2.png',
	'/images/car3.png',
	'/images/car4.png',
];

export const boat_icon = [
	'/images/boat1.png',
	'/images/boat2.png',
	'/images/boat3.png',
	'/images/boat4.png',
];

export const flightPath_colors = [
	'#75A4D3',
	'#75D3A4',
	'#A475D3',
	'#A4D375',
	'#D3A475',
	'#D375A4',
];

export const swarm_quad_location_icon = [
	'/images/drone_q1_32x32.png',
	'/images/drone_q2_32x32.png',
	'/images/drone_q3_32x32.png',
	'/images/drone_q4_32x32.png',
];

export const swarm_plane_location_icon = [
	'/images/drone_1_32x32.png',
	'/images/drone_2_32x32.png',
	'/images/drone_3_32x32.png',
	'/images/drone_4_32x32.png',
];

// map Color Selection
export const v_colorDrawPathes = [
	'#FF5733', // Vivid Orange-Red (XYZ)
	'#33FF57', // Bright Lime Green (ZYX)
	'#5733FF', // Deep Blue-Violet (YZX)
	'#FF33C7', // Magenta-Pink (XZY)
	'#33C7FF', // Cyan-Blue (ZXY)
	'#C7FF33', // Chartreuse Yellow (YXZ)
	'#FFC733', // Golden Yellow
	'#33FFC7', // Sea Green
	'#C733FF', // Purple
	'#3357FF', // Darker Blue
	'#FF3357', // Darker Red
	'#57FF33',  // Lighter Green
];

// Dialog Icons
export const DIALOG_ICONS = Object.freeze({
	GOTO: '↗',
	CLOSE: '×',
	MINIMIZE: '▼',
	MAXIMIZE: '▲',
	OPAQUE: '●',
	TRANSPARENT: '○',
});

Object.freeze({
	planes_icon, quad_icon, quad_glb_colors, rover_icon, boat_icon, flightPath_colors,
	swarm_quad_location_icon, swarm_plane_location_icon, v_colorDrawPathes,
});
