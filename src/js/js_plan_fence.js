/***************************************************

	30 Jul 2016
	30 Aug 2024

*****************************************************/
import { js_globals } from './js_globals.js';

import * as js_andruavMessages from './js_andruavMessages.js'



export class ClssAndruavFencePlan {
	constructor(p_id/*, p_initColor*/) {
		if (p_id === null || p_id === undefined) throw new Error('Error Bad ID');
		this.m_id = p_id;


		this.v_highLight = false;
		this.m_hidden = false;
	}

	fn_generateAndruavFenceData(shapes) {
		let shapesData = [];
		const len = js_globals.v_map_shapes.length;

		for (let i = 0; i < len; ++i) {

			let cmd = {};
			const c_shape = shapes[i];

			if (c_shape.m_geofenceInfo === undefined) continue;  // not a fence
			if (c_shape.m_geofenceInfo.m_deleted === true) continue;

			cmd.n = c_shape.m_geofenceInfo.m_geoFenceName;
			cmd.a = c_shape.m_geofenceInfo.isHardFence === undefined ? 0 : c_shape.m_geofenceInfo.isHardFence;
			cmd.o = c_shape.m_geofenceInfo.m_shouldKeepOutside ? 1 : 0;
			cmd.r = parseInt(c_shape.m_geofenceInfo.m_maximumDistance);
			let lnglat = {};
			switch (c_shape.pm.m_shape_type) {
				case 'Marker':
					break;

				case 'Polygon':
					{
						cmd.t = js_andruavMessages.FENCETYPE_PolygonFence;
						const c_lnglats = c_shape.getLatLngs()[0];

						const len_lnglat = c_lnglats.length;

						for (let j = 0; j < len_lnglat; ++j) {
							lnglat = {};
							lnglat.a = c_lnglats[j].lat;
							lnglat.g = c_lnglats[j].lng;
							cmd[j] = lnglat;
						}

						cmd.c = len_lnglat;
					}
					break;

				case 'Rectangle':
					{
						cmd.t = js_andruavMessages.FENCETYPE_PolygonFence;
						const c_boundary = c_shape.getBounds();

						lnglat.a = c_boundary._northEast.lat;
						lnglat.g = c_boundary._northEast.lng;
						cmd[0] = lnglat;

						lnglat = {};
						lnglat.a = c_boundary._southWest.lat;
						lnglat.g = c_boundary._northEast.lng;
						cmd[1] = lnglat;

						lnglat = {};
						lnglat.a = c_boundary._southWest.lat;
						lnglat.g = c_boundary._southWest.lng;
						cmd[2] = lnglat;

						lnglat = {};
						lnglat.a = c_boundary._northEast.lat;
						lnglat.g = c_boundary._southWest.lng;
						cmd[3] = lnglat;


						cmd.c = 4;
					}
					break;

				case 'Circle':
					{
						cmd.t = js_andruavMessages.FENCETYPE_CylindersFence;
						const c_center = c_shape.getLatLng();

						lnglat.a = c_center.lat;
						lnglat.g = c_center.lng;
						cmd["0"] = lnglat;
						cmd.c = 1;
					}
					break;

				case 'Line':
					{
						cmd.t = js_andruavMessages.FENCETYPE_LinearFence;
						const c_lnglats = c_shape.getLatLngs();

						const len_lnglat = c_lnglats.length;

						for (let j = 0; j < len_lnglat; ++j) {
							lnglat.a = c_lnglats[j].lat;
							lnglat.g = c_lnglats[j].lng;
							cmd[j] = lnglat;
						}

						cmd.c = len_lnglat;
					}
					break;

				default:

					break;
			}

			shapesData.push(cmd);
		}

		return shapesData;
	}
}