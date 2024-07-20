
import React    from 'react';
import ReactDOM from "react-dom/client";


import $ from 'jquery';
import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Modal from 'bootstrap/js/dist/modal';
import Dialog from 'bootstrap/js/dist/modal';

import RecordRTC from 'recordrtc';


import * as js_andruavMessages from './js_andruavMessages'
import * as js_siteConfig from './js_siteConfig'
import * as js_helpers from './js_helpers'
import {js_globals} from './js_globals.js';
import {js_speak} from './js_speak'

import * as js_andruavUnit from './js_andruavUnit'
import * as js_andruavclient2 from './js_andruavclient2'
import {js_andruavAuth} from './js_andruavAuth'
import {js_leafletmap} from './js_leafletmap'
import {js_eventEmitter} from './js_eventEmitter'
import {js_localStorage} from './js_localStorage'
import {js_webrtcstream} from './js_webrtcthin2.js'
import * as js_mapmission from './js_mapmission'
import {js_adsbUnit} from './js_adsbUnit.js'
import { mavlink20 } from './js_mavlink_v2.js'

import {Clss_MainContextMenu} from '../components/popups/jsc_main_context_menu.jsx'

const isNumber = require('is-number');

var oldAppend = $.fn.append;

$.fn.append = function($el){
    var dom = ($el instanceof $) ? $el[0] : $el
    if(dom && dom.tagName==='SCRIPT'){
        this[0].appendChild(dom)
        return this
    }
    return oldAppend.apply(this,arguments)
}

var v_contextMenuOpen = false;

function showDialog (id, show)
{
	const obj = document.getElementById(id);
	if (show === true && (obj !== null || obj !== undefined))
	{
		obj.style.display = 'block';
	}

	if (show === false && (obj !== null || obj !== undefined))
	{
		obj.style.display = 'none';
	}
}

var elevator;

export var QueryString = function () {
	// This function is anonymous, is executed immediately and 
	// the return value is assigned to QueryString!
	var query_string = {};
	var query = window.location.search.substring(1);
	var vars = query.split("&");
	for (var i = 0; i < vars.length; i++) {
		var pair = vars[i].split("=");
		// If first entry with this name
		if (typeof query_string[pair[0]] === "undefined") {
			query_string[pair[0]] = decodeURIComponent(pair[1]);
			// If second entry with this name
		} else if (typeof query_string[pair[0]] === "string") {
			var arr = [query_string[pair[0]], decodeURIComponent(pair[1])];
			query_string[pair[0]] = arr;
			// If third or later entry with this name
		} else {
			query_string[pair[0]].push(decodeURIComponent(pair[1]));
		}
	}
		return query_string;
}();

// COULD BE REMOVED I GUESS
function enableDragging() {
	(function ($) {
		$.fn.drags = function (opt) {

			opt = $.extend({ handle: "", cursor: "move" }, opt);
			var $el;
			if (opt.handle === "") {
				$el = this;
			} else {
				$el = this.find(opt.handle);
			}

			return $el.css('cursor', opt.cursor).on("mousedown", function (e) {
				var $drag;
				if (opt.handle === "") {
					$drag = $(this).addClass('draggable');
				} else {
					$drag = $(this).addClass('active-handle').parent().addClass('draggable');
				}
				var z_idx = $drag.css('z-index'),
				drg_h = $drag.outerHeight(),
				drg_w = $drag.outerWidth(),
				pos_y = $drag.offset().top + drg_h - e.pageY,
				pos_x = $drag.offset().left + drg_w - e.pageX;
				$drag.css('z-index', 1000).parents().on("mousemove", function (e) {
					$('.draggable').offset({
								top: e.pageY + pos_y - drg_h,
								left: e.pageX + pos_x - drg_w
							}).on("mouseup", function () {
								$(this).removeClass('draggable').css('z-index', z_idx);
							});
						});
						e.preventDefault(); // disable selection
					}).on("mouseup", function () {
						if (opt.handle === "") {
							$(this).removeClass('draggable');
						} else {
							$(this).removeClass('active-handle').parent().removeClass('draggable');
						}
					});
				}
	})($);


	//$("[data-bs-toggle=tooltip]").tooltip(); REACT2
	//$("[data-bs-toggle=tooltip]").drags();  REACT2
}
        

function fn_handleKeyBoard() {

	$('body').keydown(function (p_event) {
		p_event = p_event || window.event;
	if (p_event.key === null || p_event.key === undefined) return ;

	if (p_event.type === "keydown")
	{
		if (p_event.altKey === true) {

		}

		if (p_event.ctrlKey) {
            var c = p_event.which || p_event.keyCode;
            if (c === 82) {
                p_event.preventDefault();
                p_event.stopPropagation();
            }
        }
		
		if (p_event.target.type !== 'textarea')
		{
			if (p_event.key.toLowerCase() === 'm') {
				fn_showMap();
			}
			
			if (p_event.key.toLowerCase() === 'r') {
				fn_showVideoMainTab();
			}
		}
	}
	});

}
        

        

		export function fn_do_modal_confirmation(p_title, p_message, p_callback, p_yesCaption, p_style, p_noCaption) {
			if (p_style === null || p_style === undefined) {
				p_style = "bg-success";
			}
			p_style += " p-1 rounded_10px ";
			var callback = p_callback;
			$('#modal_saveConfirmation').children().find('h4#title').html(p_title);
			$('#modal_saveConfirmation').children().find('h4#title').addClass("modal-title " + p_style);
			$('#modal_saveConfirmation').children().find('div.modal-body').html(p_message);
			$('#modal_saveConfirmation').children().find('button#modal_btn_confirm').unbind('click');
			$('#modal_saveConfirmation').children().find('button#btnCancel').unbind('click');
			$('#modal_saveConfirmation').children().find('button#btnCancel').on('click', function () 
			{
				callback(false);
				const modal = new Modal($('#modal_saveConfirmation')); // Instantiates your modal
				modal.hide()
			});
			if (p_yesCaption === null || p_yesCaption === undefined)
			{
				p_yesCaption = "Yes";
			} 
			if (p_noCaption === null || p_noCaption === undefined)
			{
				p_noCaption = "Cancel"
			}

			$('#modal_saveConfirmation').children().find('button#modal_btn_confirm').html(p_yesCaption);
			$('#modal_saveConfirmation').children().find('button#btnCancel').html(p_noCaption);
			
			//$('#modal_saveConfirmation').modal('show');
			const modal = new Modal($('#modal_saveConfirmation')); // Instantiates your modal
			modal.show();
			
		}



		export function fn_takeLocalImage(p_andruavUnit, videoTrackID) {
			var v_videoctrl = '#videoObject' + videoTrackID;
			var v_video = $(v_videoctrl)[0];
			var v_canvas = document.createElement('canvas');
			v_canvas.width = v_video.videoWidth;
			v_canvas.height = v_video.videoHeight;
			var ctx = v_canvas.getContext('2d');

			//draw image to canvas. scale to target dimensions
			ctx.drawImage(v_video, 0, 0);

			//convert to desired file format
			var dataURI = v_canvas.toDataURL("image/png"); // can also use 'image/png'
			js_helpers.fn_saveData(dataURI, 'image/png');
		}


		export function fn_startrecord(v_andruavUnit, v_videoTrackID) {

			// var options = {
			// 	type: 'video',
			// 	frameInterval: 30,
			// 	dontFireOnDataAvailableEvent: true,
			// 	canvas: { // this line works only in Chrome
			// 		width: 1280,
			// 		height: 720
			// 	},
			// 	video: { // this line works only in Chrome
			// 		width: 1280,
			// 		height: 720
			// 	}
			// };


			var v_talk = v_andruavUnit.m_Video.m_videoactiveTracks[v_videoTrackID];
			const recorder = RecordRTC(v_talk.stream, {
				type: 'video'
			  });
			
			  // Start recording
			  recorder.startRecording();
			
			//   // Stop recording after 10 seconds
			//   setTimeout(() => {
			// 	recorder.stopRecording(() => {
			// 	  // Get the recorded video blob
			// 	  const videoBlob = recorder.getBlob();
			
			// 	  // Do something with the recorded video, e.g., upload it to a server
			// 	  console.log('Recorded video blob:', videoBlob);
			// 	});
			//   }, 10000);

			v_talk.videoRecording = true;
			v_talk.recorderObject = recorder;
			js_eventEmitter.fn_dispatch(js_globals.EE_videoStreamRedraw, { 'andruavUnit': v_andruavUnit, 'v_track': v_videoTrackID });

		}




		function fn_doGimbalCtrlStep(unit, stepPitch, stepRoll, stepYaw) {
			js_globals.v_andruavClient.API_do_GimbalCtrl(unit,
				stepPitch,
				stepRoll,
				stepYaw, false);
		}

		function fn_doGimbalCtrl(unit, pitch, roll, yaw) {
			js_globals.v_andruavClient.API_do_GimbalCtrl(unit, pitch, roll, yaw, true);
		}


		export function fn_showVideoMainTab() {
			$('#div_map_view').hide();
			$('#div_video_control').show();

			$('#btn_showMap').show();
			$('#btn_showVideo').hide();
		}


		function fn_activateClassicalView()
		{
			$('#row_2').show();
			$('#row_1').show();
			$('#row_1').removeClass();
			$('#row_2').removeClass();
			$('#row_1').addClass('col-lg-8 col-xl-8 col-xxl-8 col-12');
			$('#row_2').addClass('col-lg-4 col-xl-4 col-xxl-4 col-12');
			
			$('#div_map_view').show();
			$('#andruav_unit_list_array_fixed').hide();
			$('#andruav_unit_list_array_float').hide();
			
			$('#btn_showSettings').show();

			$('#btn_showVideo').show();
			$('#btn_showMap').show();

			$([document.documentElement, document.body]).animate({
				scrollTop: $("#row_2").offset().top
			}, 100);
		}

		function fn_activateMapCameraSectionOnly()
		{
			$('#row_2').hide();
			$('#row_1').show();
			$('#row_1').removeClass();
			$('#row_1').addClass('col-12');
			
			$('#div_map_view').show();
			$('#andruav_unit_list_array_fixed').hide();
			$('#andruav_unit_list_array_float').hide();
			
			$('#btn_showSettings').hide();
			$('#btn_showVideo').show();
			$('#btn_showMap').hide();
		}


		function fn_activateFixedVehicleListOnly()
		{
			$('#row_2').hide();
			$('#row_1').show();
			$('#row_1').removeClass();
			$('#row_1').addClass('col-12');
					
			$('#div_map_view').hide();
			$('#andruav_unit_list_array_fixed').show();
			$('#andruav_unit_list_array_float').hide();
			
			$('#btn_showSettings').hide();
			$('#btn_showVideo').hide();
			$('#btn_showMap').hide();
		}
		
		function fn_activateMapCameraSectionAndFloatingList()
		{
			$('#row_2').hide();
			$('#row_1').show();
			$('#row_1').removeClass();
			$('#row_1').addClass('col-12');
			
			$('#div_map_view').show();
			$('#andruav_unit_list_array_fixed').hide();
			$('#andruav_unit_list_array_float').show();
			$('#andruav_unit_list_array_float').css({top: 400, left: 10, position:'absolute'});
			
			$('#btn_showSettings').hide();
			$('#btn_showVideo').show();
			$('#btn_showMap').hide();
		}

		function fn_activateAllViews()
		{
			$('#row_2').show();
			$('#row_1').show();
			$('#row_1').removeClass();
			$('#row_2').removeClass();
			$('#row_1').addClass('col-lg-8 col-xl-8 col-xxl-8 col-12');
			$('#row_2').addClass('col-lg-4 col-xl-4 col-xxl-4 col-12');
					
					
			$('#div_map_view').show();
			$('#andruav_unit_list_array_fixed').hide();
			$('#andruav_unit_list_array_float').show();
			$('#andruav_unit_list_array_float').css({top: 400, left: 10, position:'absolute'});
			
			$('#btn_showSettings').show();
			$('#btn_showVideo').show();
			$('#btn_showMap').show();

			$([document.documentElement, document.body]).animate({
				scrollTop: $("#row_2").offset().top
			}, 100);
		}

		function fn_activateVehicleCardOnly()
		{
			$('#row_2').show();
			$('#row_1').hide();
			$('#row_2').removeClass();
			$('#row_2').addClass('col-12');

			$('#div_map_view').hide();
			$('#andruav_unit_list_array_fixed').hide();
			$('#andruav_unit_list_array_float').hide();
			
			$('#btn_showSettings').show();
			$('#btn_showVideo').hide();
			$('#btn_showMap').hide();
		}

		export function fn_applyControl(v_small_mode)
		{
			var v_display_mode = js_localStorage.fn_getDisplayMode();
		
			if (v_display_mode==null) v_display_mode = 0;
			
			if (v_small_mode===true)
			{
				switch (v_display_mode%4)
				{
					case 0:
						// Classic View
						fn_activateClassicalView();
						$('#btn_showControl').html("<strong>DISPLAY-1</strong>");

					break;
						
					case 1:
						// Map or Camera Only
						fn_activateMapCameraSectionOnly();
						$('#btn_showControl').html("<strong>DISPLAY-2</strong>");
					break;

					
					case 2:
						// Vehicle List
						fn_activateFixedVehicleListOnly();
						$('#btn_showControl').html("<strong>DISPLAY-3</strong>");
					break;

					case 3:
						// Vehicle Control Cards
						fn_activateVehicleCardOnly();
						$('#btn_showControl').html("<strong>DISPLAY-4</strong>");
					break;

					default:
					break;
				}
			}
			else
			{
				switch (v_display_mode%6)
				{
					case 0:
						// Classic View
						fn_activateClassicalView();
						$('#btn_showControl').html("<strong>DISPLAY-1</strong>");
					break;
						
					case 1:
						fn_activateMapCameraSectionOnly();
						$('#btn_showControl').html("<strong>DISPLAY-2</strong>");
					break;

					
					case 2:
						fn_activateMapCameraSectionAndFloatingList();
						$('#btn_showControl').html("<strong>DISPLAY-3</strong>");
					break;

					case 3:
						fn_activateFixedVehicleListOnly();
						$('#btn_showControl').html("<strong>DISPLAY-4</strong>");
					break;

					case 4:
						fn_activateVehicleCardOnly();
						$('#btn_showControl').html("<strong>DISPLAY-5</strong>");
					break;
					
					case 5:
						fn_activateAllViews();
						$('#btn_showControl').html("<strong>DISPLAY-6</strong>");
					break;

					default:
					break;
				}
			}

			js_localStorage.fn_setDisplayMode(v_display_mode);
			js_leafletmap.fn_invalidateSize();
		}

		export function fn_showControl(v_small_mode) {
			js_localStorage.fn_setDisplayMode(parseInt(js_localStorage.fn_getDisplayMode())+1);
			fn_applyControl(v_small_mode);
		}

		


		export function fn_showMap() {
			$('#div_video_control').hide();
			$('#div_map_view').show();
			$('#btn_showMap').hide();
			$('#btn_showVideo').show();
		}

		export function fn_showSettings() {
			$('#andruavUnits_in').toggle();
			
			$([document.documentElement, document.body]).animate({
				scrollTop: $("#row_2").offset().top
			}, 100);
		}

		function onWEBRTCSessionStarted(c_talk) {
			var v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(c_talk.number);
			v_andruavUnit.m_Video.m_videoactiveTracks[c_talk.targetVideoTrack] = c_talk;
			js_eventEmitter.fn_dispatch(js_globals.EE_videoStreamStarted, { 'andruavUnit': v_andruavUnit, 'talk': c_talk });
			js_eventEmitter.fn_dispatch(js_globals.EE_unitUpdated, v_andruavUnit);
			//js_globals.v_andruavClient.pub_streamOnOff = p;
		}

		function onWEBRTCSessionEnded(c_talk) {
			var v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(c_talk.number);
			
			v_andruavUnit.m_Video.m_videoactiveTracks[c_talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
			js_eventEmitter.fn_dispatch(js_globals.EE_videoStreamStopped, { 'andruavUnit': v_andruavUnit, 'talk': c_talk });
			js_eventEmitter.fn_dispatch(js_globals.EE_unitUpdated, v_andruavUnit);
		}


		function onWEBRTCSessionOrphanEnded(c_number) {
			var v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(c_number);
			v_andruavUnit.m_Video.m_videoactiveTracks[c_number].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
			js_eventEmitter.fn_dispatch(js_globals.EE_unitUpdated, v_andruavUnit);
		}



		


		function fn_WEBRTC_login(v_partyID,v_trackID) {
		
			js_webrtcstream.onOrphanDisconnect = onWEBRTCSessionOrphanEnded;

			js_webrtcstream.joinStream(
				{

					'number': v_partyID,
					'targetVideoTrack': v_trackID,
					'v_andruavClient': js_globals.v_andruavClient,
					onDisplayVideo: onWEBRTCSessionStarted,
					onError: function (v_talk, v_errormsg) { js_speak.fn_speak(v_errormsg); },
					onRemovestream: function () {
					},
					onDisconnected: onWEBRTCSessionEnded,

				}
			);
		}


		export function fn_VIDEO_login(v_andruavVideo, v_trackId) {

			var len = v_andruavVideo.m_unit.m_Video.m_videoTracks.length;
			for (var i=0;i<len;++i)
			{
				if (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].id === v_trackId)
				{
					switch (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].p)
					{
						case js_andruavMessages.CONST_EXTERNAL_CAMERA_TYPE_RTCWEBCAM:
							fn_WEBRTC_login(v_andruavVideo.m_unit.partyID,v_trackId);
						break;

						case js_andruavMessages.CONST_EXTERNAL_CAMERA_TYPE_FFMPEGWEBCAM:
							//NOT USED
						break;
						
						default:
						break;
					}
					break;
				}
			}
		}


		/*
			Video Recording
		*/
		export function fn_VIDEO_Record(v_andruavVideo, v_trackId, p_Start) {

			if (v_andruavVideo === null || v_andruavVideo === undefined) return ;

			var len = v_andruavVideo.m_unit.m_Video.m_videoTracks.length;
			for (var i=0;i<len;++i)
			{
				if (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].id === v_trackId)
				{
					js_globals.v_andruavClient.API_CONST_RemoteCommand_recordVideo (v_andruavVideo.m_unit.partyID, v_trackId, p_Start);
				}
			}
		}


        function fn_doYAW(p_andruavUnit, targetAngle, turnRate, isClockwise, isRelative) {
        	js_globals.v_andruavClient.API_do_YAW(p_andruavUnit, targetAngle, turnRate, isClockwise, isRelative);
		}
		
		function fn_getadsbIcon(_obj, droneAltitude) {
			if (_obj.Help) {
				return './images/station-in-action-icon.png';
			}

			var degIndex = parseInt(_obj.Heading / 22);


			if (_obj.Ground) {
				switch (degIndex) {
					case 15:
					case 0:
						return './images/blure/adrone_gr_32x32.png';
					case 1:
					case 2:
						return './images/blure/adrone_gr_32x32x45d.png';
					case 3:
					case 4:
						return './images/blure/adrone_gr_32x32x90d.png';
					case 5:
					case 6:
						return './images/blure/adrone_gr_32x32x135d.png';
					case 7:
					case 8:
						return './images/blure/adrone_gr_32x32x180d.png';
					case 9:
					case 10:
						return './images/blure/adrone_gr_32x32x225d.png';
					case 11:
					case 12:
						return './images/blure/adrone_gr_32x32x270d.png';
					case 13:
					case 14:
						return './images/blure/adrone_gr_32x32x315d.png';
					default: // NAN if Heading is null
						return './images/blure/adrone_gr_32x32.png';
				}
				return;
			}



			if ((_obj.Alt) < 500) {
				// if plane under drone by any difference, or heigher by 500 then alert
				switch (degIndex) {
					case 15:
					case 0:
						return './images/blure/adrone_br_32x32.png';
					case 1:
					case 2:
						return './images/blure/adrone_br_32x32x45d.png';
					case 3:
					case 4:
						return './images/blure/adrone_br_32x32x90d.png';
					case 5:
					case 6:
						return './images/blure/adrone_br_32x32x135d.png';
					case 7:
					case 8:
						return './images/blure/adrone_br_32x32x180d.png';
					case 9:
					case 10:
						return './images/blure/adrone_br_32x32x225d.png';
					case 11:
					case 12:
						return './images/blure/adrone_br_32x32x270d.png';
					case 13:
					case 14:
						return './images/blure/adrone_br_32x32x315d.png';
					default: // NAN if Heading is null
						return './images/blure/adrone_br_32x32.png';
				}
			}
			else {
				switch (degIndex) {
					case 15:
					case 0:
						return './images/blure/adrone_bk_32x32.png';
					case 1:
					case 2:
						return './images/blure/adrone_bk_32x32x45d.png';
					case 3:
					case 4:
						return './images/blure/adrone_bk_32x32x90d.png';
						break;
					case 5:
					case 6:
						return './images/blure/adrone_bk_32x32x135d.png';
					case 7:
					case 8:
						return './images/blure/adrone_bk_32x32x180d.png';
					case 9:
					case 10:
						return './images/blure/adrone_bk_32x32x225d.png';
					case 11:
					case 12:
						return './images/blure/adrone_bk_32x32x270d.png';
					case 13:
					case 14:
						return './images/blure/adrone_bk_32x32x315d.png';
					default: // NAN if Heading is null
						return './images/blure/adrone_bk_32x32.png';
				}
			}
		}

		function fn_handleADSBPopup(p_obj) {
			
		}

		function fn_adsbExpiredUpdate(me)
		{
			const ADSB_OBJECT_TIMEOUT = 13000;
			const count = js_adsbUnit.count;
			const now = new Date();
			const p_keys = Object.keys(js_adsbUnit.List);
		
			for (var i=0; i< count; ++i)
			{
				var adsb_obj  = js_adsbUnit.List[p_keys[i]];

				if ((now - adsb_obj.m_last_access) > ADSB_OBJECT_TIMEOUT)
				{
					if (adsb_obj.p_marker !== null && adsb_obj.p_marker !== undefined)
					{
						js_leafletmap.fn_hideItem(adsb_obj.p_marker);
					}
				}
			}
		}

		function fn_adsbObjectUpdate(me, p_adsbObject)
		{
			var v_marker = p_adsbObject.p_marker;
			if (v_marker === null || v_marker === undefined)
			{
				var icon;
				switch (parseInt(p_adsbObject.m_emitter_type))
				{
					case mavlink20.ADSB_EMITTER_TYPE_NO_INFO:
						icon = './images/ufo.png';
						break;
					case mavlink20.ADSB_EMITTER_TYPE_LIGHT:
					case mavlink20.ADSB_EMITTER_TYPE_SMALL:
					case mavlink20.ADSB_EMITTER_TYPE_LARGE:
					case mavlink20.ADSB_EMITTER_TYPE_HIGH_VORTEX_LARGE:
					case mavlink20.ADSB_EMITTER_TYPE_HEAVY:
					case mavlink20.ADSB_EMITTER_TYPE_HIGHLY_MANUV:
					case mavlink20.ADSB_EMITTER_TYPE_ROTOCRAFT:
					case mavlink20.ADSB_EMITTER_TYPE_UNASSIGNED:
					case mavlink20.ADSB_EMITTER_TYPE_GLIDER:
					case mavlink20.ADSB_EMITTER_TYPE_LIGHTER_AIR:
					case mavlink20.ADSB_EMITTER_TYPE_PARACHUTE:
					case mavlink20.ADSB_EMITTER_TYPE_ULTRA_LIGHT:
					case mavlink20.ADSB_EMITTER_TYPE_UNASSIGNED2:
					case mavlink20.ADSB_EMITTER_TYPE_UAV:
					case mavlink20.ADSB_EMITTER_TYPE_SPACE:
					case mavlink20.ADSB_EMITTER_TYPE_UNASSGINED3:
					case mavlink20.ADSB_EMITTER_TYPE_EMERGENCY_SURFACE:
					case mavlink20.ADSB_EMITTER_TYPE_SERVICE_SURFACE:
					case mavlink20.ADSB_EMITTER_TYPE_POINT_OBSTACLE:
						icon = './images/Plane_Track.png';
						break;
					case mavlink20.ADSB_EMITTER_TYPE_ROTOCRAFT:
						icon = './images/Quad_Track.png';
						break;
					default:
						// display nothing
						return ;
				}
				
				var v_htmladsb = "<p class='text-warning margin_zero'>" + p_adsbObject.m_icao_address + "</p>";
					
				v_marker = js_leafletmap.fn_CreateMarker(icon, p_adsbObject.m_icao_address, null, false, false, v_htmladsb,[64,64]) ;
				p_adsbObject.p_marker = v_marker;
			}

			js_leafletmap.fn_setPosition_bylatlng(p_adsbObject.p_marker, p_adsbObject.m_lat, p_adsbObject.m_lon, p_adsbObject.m_heading);
			js_leafletmap.fn_showItem(p_adsbObject.p_marker);
		}

		function fn_adsbUpdated(p_caller, p_data) {
			
        }
        

        function gui_alert(title, message, level) {
			$('#alert #title').html(title);
			$('#alert #title').html(title);
			$('#alert #msg').html(message);
			$('#alert').removeClass();
			$('#alert').addClass('alert alert-' + level);
			$('#alert').show();
		};

		function gui_alert_hide() {
			$('#alert').hide();
		};

		export function gui_toggleUnits(dontflip) {

			// use current metric as other browser could change it and you will lose the SYNC
			// Scenario: if two browsers one is meter and the other is feet, the last one that switch
			// will record the value and ubunts in the storage. if you changed from other browser then 
			// the values and unit of the latest browser will overwrite the saved one... but if you refresh
			// the browser instead of changing the units the latter will take the values of the first one.
			js_localStorage.fn_setMetricSystem(js_globals.v_useMetricSystem);
            
			if (js_localStorage.fn_getMetricSystem() === true) {
				if (dontflip !== true) js_globals.v_useMetricSystem = false;

				js_localStorage.fn_setMetricSystem(false);
				js_globals.CONST_DEFAULT_ALTITUDE = (js_helpers.CONST_METER_TO_FEET * js_globals.CONST_DEFAULT_ALTITUDE).toFixed(0);
				js_globals.CONST_DEFAULT_RADIUS = (js_helpers.CONST_METER_TO_FEET * js_globals.CONST_DEFAULT_RADIUS).toFixed(0);

				js_globals.CONST_DEFAULT_ALTITUDE_min = js_globals.CONST_DEFAULT_ALTITUDE_min * js_helpers.CONST_METER_TO_FEET;
				js_globals.CONST_DEFAULT_RADIUS_min = js_globals.CONST_DEFAULT_RADIUS_min * js_helpers.CONST_METER_TO_FEET;

			}
			else {
				if (dontflip !== true) js_globals.v_useMetricSystem = true;

				js_localStorage.fn_setMetricSystem(true);
				js_globals.CONST_DEFAULT_ALTITUDE = (js_helpers.CONST_FEET_TO_METER * js_globals.CONST_DEFAULT_ALTITUDE).toFixed(0);
				js_globals.CONST_DEFAULT_RADIUS = (js_helpers.CONST_FEET_TO_METER * js_globals.CONST_DEFAULT_RADIUS).toFixed(0);

				js_globals.CONST_DEFAULT_ALTITUDE_min = js_globals.CONST_DEFAULT_ALTITUDE_min * js_helpers.CONST_FEET_TO_METER;
				js_globals.CONST_DEFAULT_RADIUS_min = js_globals.CONST_DEFAULT_RADIUS_min * js_helpers.CONST_FEET_TO_METER;
			}
			eval("if (window.top !== window.self) window.top.location.replace(window.self.location.href)");
			js_localStorage.fn_setDefaultAltitude(js_globals.CONST_DEFAULT_ALTITUDE);
			js_localStorage.fn_setDefaultRadius(js_globals.CONST_DEFAULT_RADIUS);
		};

		export function fn_convertToMeter(value) {
			if (isNaN(value)) return 0;
			if (js_localStorage.fn_getMetricSystem() === true) {
				return value;
			}
			else {
				return value * js_helpers.CONST_FEET_TO_METER;
			}
		};

		function gui_initGlobalSection() {
			// REACT
			$("#yaw_knob").dial({
				fgColor: "#3671AB"
				, bgColor: "#36AB36"
				, thickness: .3
				, cursor: 10
				, displayPrevious: true
			})
				.css({ display: 'inline', padding: '0px 10px' });

			$("#yaw_knob").knob({
				'change': function (v) { }
			});





			$('#andruavUnitGlobals').hide();


		};

		function fn_setLapout () 
		{
			if ((QueryString.displaymode !== null && QueryString.displaymode !== undefined) || (isNumber(parseInt(QueryString.displaymode))))
			{
				fn_applyControl(QueryString.displaymode);
			}
			else
			{
				fn_applyControl(0);
			}
		}

		function fn_gps_getLocation() {

			function setPosition(position) {

				js_globals.myposition = position;
				if (js_globals.CONST_DISABLE_ADSG === false) {
					js_adsbUnit.fn_changeDefaultLocation(
						js_globals.myposition.coords.latitude,
						js_globals.myposition.coords.longitude, 1000);
				}
				js_leafletmap.fn_PanTo_latlng(
					js_globals.myposition.coords.latitude,
					js_globals.myposition.coords.longitude);

				js_leafletmap.fn_setZoom (8);
			}

			if (QueryString.lat !== null && QueryString.lat !== undefined)
			{
				js_leafletmap.fn_PanTo_latlng(
					QueryString.lat,
					QueryString.lng);

				js_leafletmap.fn_setZoom (QueryString.zoom);

				return ;
			}

			if (navigator.geolocation) {
				navigator.geolocation.getCurrentPosition(setPosition, gps_showError);
			} else {
				// "Geolocation is not supported by this browser.";
			}
		}

		// function fn_gps_showPosition(position) {
		// 	var latlng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
		// 	map.panTo(latlng);
		// 	map.setZoom(8);
		// }


		function gps_showError(p_error) {
			switch (p_error.code) {
				case p_error.PERMISSION_DENIED:
					//x.innerHTML = "User denied the request for Geolocation."
					break;
				case p_error.POSITION_UNAVAILABLE:
					//x.innerHTML = "Location information is unavailable."
					break;
				case p_error.TIMEOUT:
					//x.innerHTML = "The request to get user location timed out."
					break;
				case p_error.UNKNOWN_ERROR:
					//x.innerHTML = "An unknown p_error occurred."
					break;
			}
		}

		function saveData(fileURL, fileName) {
			//http://muaz-khan.blogspot.com.eg/2012/10/save-files-on-disk-using-javascript-or.html
			// for non-IE
			if (!window.ActiveXObject) {
				var save = document.createElement('a');
				save.href = fileURL;
				save.target = '_blank';
				save.download = fileName || 'unknown';
				save.click();
			}

			// for IE
			else if (!window.ActiveXObject && document.execCommand) {
				var _window = window.open(fileURL, '_blank');
				_window.document.close();
				_window.document.execCommand('SaveAs', true, fileName || fileURL);
				_window.close();
			}
		}


		
		export function fn_openFenceManager(p_partyID) {
			var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit === null || p_andruavUnit === undefined) {
				return;
			}

			window.open('mapeditor.html?zoom=18&lat=' + p_andruavUnit.m_Nav_Info.p_Location.lat + '&lng=' + p_andruavUnit.m_Nav_Info.p_Location.lng);
			return false;
		}

		export function fn_switchGPS(p_andruavUnit) {
			if (p_andruavUnit === null || p_andruavUnit === undefined) {
				return;
			}

			js_globals.v_andruavClient.API_setGPSSource(p_andruavUnit, (p_andruavUnit.m_GPS_Info1.gpsMode + 1) % 3)
		}

		

		function gui_camCtrl(p_partyID) {
			// var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
			// if (p_andruavUnit === null || p_andruavUnit === undefined) {
			// 	return;
			// }

			// $('#modal_ctrl_cam').attr('partyID', p_partyID);
			// $('#modal_ctrl_cam').attr('data-original-title', 'Camera Control - ' + p_andruavUnit.m_unitName);
			// $('#modal_ctrl_cam').show();

		}

		export function gui_doYAW(p_partyID) {
			var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit === null || p_andruavUnit === undefined) {
				return;
			}

			var ctrl_yaw = $('#modal_ctrl_yaw').find('#btnYaw');
			ctrl_yaw.unbind("click");
			ctrl_yaw.on('click', function () {
				const target_angle_deg = $('#yaw_knob').val();
				const current_angle_deg = (js_helpers.CONST_RADIUS_TO_DEGREE * ((p_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2)).toFixed(1);
				let direction = js_helpers.isClockwiseAngle (current_angle_deg, target_angle_deg);
				fn_doYAW(p_andruavUnit, $('#yaw_knob').val(), 0, !direction, false);
			});

			var ctrl_yaw = $('#modal_ctrl_yaw').find('#btnResetYaw');
			ctrl_yaw.unbind("click");
			ctrl_yaw.on('click', function () {
				$('#yaw_knob').val(0);
				$('#yaw_knob').trigger('change');
				fn_doYAW(p_andruavUnit, -1, 0, true, false);
			});


			$('#yaw_knob').val((js_helpers.CONST_RADIUS_TO_DEGREE * ((p_andruavUnit.m_Nav_Info.p_Orientation.yaw + js_helpers.CONST_PTx2) % js_helpers.CONST_PTx2)).toFixed(1));
			$('#yaw_knob').trigger('change');
			$('#modal_ctrl_yaw').attr('data-original-title', 'YAW Control - ' + p_andruavUnit.m_unitName);
			$('#modal_ctrl_yaw').attr('partyID', p_partyID);
			//$('#modal_ctrl_yaw').show(p_partyID);
			showDialog("modal_ctrl_yaw", true);
		}


		function fn_doCircle(p_partyID) {
			js_globals.v_andruavClient.API_do_FlightMode(p_partyID, js_andruavUnit.CONST_FLIGHT_CONTROL_CIRCLE);
		}
		
		export function fn_doCircle2(p_partyID, latitude, longitude, altitude, radius, turns) {

			var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit === null || p_andruavUnit === undefined) return;
			if ((p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_ROVER)
			|| (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_BOAT)) return;

			function fn_doCircle2_prv() {
				js_speak.fn_speak('point recieved');
				js_globals.v_andruavClient.API_do_CircleHere(p_partyID, latitude, longitude, altitude, radius, turns);
			}

			fn_doCircle2_prv(p_partyID);


		}


		export function fn_doSetHome(p_partyID, p_latitude, p_longitude, p_altitude) {

			var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
				fn_do_modal_confirmation("Set Home Location for  " + p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT, "Changing Home Location changes RTL destination. Are you Sure?", function (p_approved) {
					if (p_approved === false) return;
					js_speak.fn_speak('home sent');
					js_globals.v_andruavClient.API_do_SetHomeLocation(p_partyID, p_latitude, p_longitude, p_altitude);

				}, "YES");
			}
		}

		export function fn_doFlyHere(p_partyID, p_latitude, p_longitude, altitude) {
			var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
				js_speak.fn_speak('point recieved');
				js_globals.v_andruavClient.API_do_FlyHere(p_partyID, p_latitude, p_longitude, altitude);
			}
		}


		function fn_doStartMissionFrom(p_partyID, p_missionNumber) {
			var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
				js_speak.fn_speak(String(p_missionNumber) + ' is a start point');
				js_globals.v_andruavClient.API_do_StartMissionFrom(p_andruavUnit, p_missionNumber );
			}
		}

		/**
		   Goto Unit on map
		**/
		export function fn_gotoUnit_byPartyID(p_partyID) {
			var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit === null || p_andruavUnit === undefined) return;

			fn_gotoUnit(p_andruavUnit);
		}
		
		export function fn_gotoUnit(p_andruavUnit) {
			if (p_andruavUnit === null || p_andruavUnit === undefined) return;

			var marker = p_andruavUnit.m_gui.m_marker;
			if (marker !== null && marker !== undefined) {
				js_leafletmap.fn_PanTo(p_andruavUnit.m_gui.m_marker);
				// commented because zoom need to be after pan is completed otherwise map pans to wrong location.
				// if (js_leafletmap.fn_getZoom() < 16) {
				// 	js_leafletmap.fn_setZoom(17);
				// }
			}
		}

		export function fn_helpPage (p_url)
		{
			window.open(p_url,'_blank');
		}

		export function fn_changeUnitInfo (p_andruavUnit)
		{
			if (p_andruavUnit === null || p_andruavUnit === undefined) return;
			
			$('#modal_changeUnitInfo').find('#title').html('Change Unit Name of ' + p_andruavUnit.m_unitName);
			$('#modal_changeUnitInfo').find('#txtUnitName').val(p_andruavUnit.m_unitName);
			$('#modal_changeUnitInfo').find('#txtDescription').val(p_andruavUnit.Description);
			$('#modal_changeUnitInfo').find('#btnOK').unbind("click");
			$('#modal_changeUnitInfo').find('#btnOK').on('click', function () {
				var v_unitName = $('#modal_changeUnitInfo').find('#txtUnitName').val();
				if (v_unitName === '' || v_unitName === undefined ) return;
				
				var v_unitDescription = $('#modal_changeUnitInfo').find('#txtDescription').val();
				if (v_unitDescription === '' ||  v_unitDescription === undefined) return;
				
				js_globals.v_andruavClient.API_setUnitName(p_andruavUnit, v_unitName, v_unitDescription);
			});
			//$('#modal_changeUnitInfo').modal('show');
			const modal = new Modal($('#modal_changeUnitInfo')); // Instantiates your modal
			modal.show();
		}

		export function fn_changeAltitude (p_andruavUnit) {

			if (p_andruavUnit === null || p_andruavUnit === undefined) return;


			var v_altitude_val = p_andruavUnit.m_Nav_Info.p_Location.alt!=null?(p_andruavUnit.m_Nav_Info.p_Location.alt).toFixed(1):0;
			if (v_altitude_val< js_globals.CONST_DEFAULT_ALTITUDE_min)
			{
				v_altitude_val = fn_convertToMeter(js_localStorage.fn_getDefaultAltitude()).toFixed(1) ;
			}

			var v_altitude_unit = 'm';

			if (js_globals.v_useMetricSystem === false) {
				v_altitude_val = (v_altitude_val * js_helpers.CONST_METER_TO_FEET).toFixed(1);
				v_altitude_unit = 'ft';
			}
			

 
			$('#changespeed_modal').find('#title').html('Change Altitude of ' + p_andruavUnit.m_unitName);
			$('#changespeed_modal').find('#txtSpeed').val(v_altitude_val);
			$('#changespeed_modal').find('#txtSpeedUnit').html(v_altitude_unit);
			$('#changespeed_modal').find('#btnOK').unbind('click');
			$('#changespeed_modal').find('#btnOK').on('click', function () {
				var v_alt = $('#changespeed_modal').find('#txtSpeed').val();
				if (v_alt === '' ||  v_alt === undefined || isNaN(v_alt)) return;
				if (js_globals.v_useMetricSystem === false) {
					// the GUI in feet and FCB in meters
					v_alt = (parseFloat(v_alt) * js_helpers.CONST_FEET_TO_METER).toFixed(1);
				}
				// save target speed as indication.
				if (p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_SUBMARINE)
				{
					js_globals.v_andruavClient.API_do_ChangeAltitude(p_andruavUnit, -v_alt);
				}
				else
				{
					js_globals.v_andruavClient.API_do_ChangeAltitude(p_andruavUnit, v_alt);
				}
			});
			//$('#changespeed_modal').modal('show');
			const modal = new Modal($('#changespeed_modal')); // Instantiates your modal
			modal.show();
		}

		/**
		 Open Change Speed Modal 
		**/
		export function fn_changeSpeed(p_andruavUnit, p_initSpeed) {
			if (p_andruavUnit === null || p_andruavUnit === undefined) return;

			var v_speed_val = p_initSpeed;
			if (v_speed_val === null || v_speed_val === undefined) 
			{	const ground_speed = p_andruavUnit.m_Nav_Info.p_Location.ground_speed;
				if (ground_speed!== null && ground_speed !== undefined)
				{
					v_speed_val = parseFloat(ground_speed);
				}
				else
				{
					v_speed_val = 0;
				}
			}
			
			var v_speed_unit;
			if (v_speed_val === null || v_speed_val === undefined) {
				return;
			} else {
				
				
				if (js_globals.v_useMetricSystem === true) {
					v_speed_val = v_speed_val.toFixed(1);
					v_speed_unit = 'm/s';
				}
				else {
					v_speed_val = (v_speed_val * js_helpers.CONST_METER_TO_MILE).toFixed(1);
					v_speed_unit = 'mph';
				}

			}
			
			$('#changespeed_modal').find('#title').html('Change Speed of ' + p_andruavUnit.m_unitName);
			$('#changespeed_modal').find('#btnOK').unbind("click");
			$('#changespeed_modal').find('#txtSpeed').val(v_speed_val);
			$('#changespeed_modal').find('#txtSpeedUnit').html(v_speed_unit);
			$('#changespeed_modal').find('#btnOK').on('click', function () {
				var v_speed = $('#changespeed_modal').find('#txtSpeed').val();
				if (v_speed === '' || v_speed === undefined || isNaN(v_speed)) return;
				if (js_globals.v_useMetricSystem === false) {
					// the GUI in miles and the FCB is meters
					v_speed = parseFloat(v_speed) * js_helpers.CONST_MILE_TO_METER;
				}
				// save target speed as indication.
				p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed = v_speed;
				js_globals.v_andruavClient.API_do_ChangeSpeed1(p_andruavUnit, parseFloat(v_speed));
			});
			//$('#changespeed_modal').modal('show');
			const modal = new Modal($('#changespeed_modal')); // Instantiates your modal
			modal.show();

		}

		export function fn_changeUDPPort(p_andruavUnit, init_pot) {
			if (p_andruavUnit === null || p_andruavUnit === undefined) return;

			var v_port_val = init_pot;
			if (v_port_val === null || v_port_val === undefined) 
			{	
				v_port_val = p_andruavUnit.m_Telemetry.m_udpProxy_port;
			}
			
			$('#changespeed_modal').find('#title').html('Change Speed of ' + p_andruavUnit.m_unitName);
			$('#changespeed_modal').find('#btnOK').unbind("click");
			$('#changespeed_modal').find('#txtSpeed').val(v_port_val);
			$('#changespeed_modal').find('#txtSpeedUnit').html("");
			$('#changespeed_modal').find('#btnOK').on('click', function () {
				var v_port_val = $('#changespeed_modal').find('#txtSpeed').val();
				if (v_port_val === '' || v_port_val === undefined || isNaN(v_port_val) || v_port_val >= 0xffff) return;
				js_globals.v_andruavClient.API_setUdpProxyClientPort(p_andruavUnit, parseInt(v_port_val));
			});
			
			//$('#changespeed_modal').modal('show');
			const modal = new Modal($('#changespeed_modal')); // Instantiates your modal
			modal.show();
		}

		/**
		   Switch Video OnOff
		*/
		export function toggleVideo(p_andruavUnit) {
			if (p_andruavUnit === null || p_andruavUnit === undefined) return;
			fn_retreiveCamerasList(p_andruavUnit);
		}


		function fn_retreiveCamerasList(p_andruavUnit) {
			if (p_andruavUnit === null || p_andruavUnit === undefined) return;

				function fn_callback (p_session)
				{
					if ((p_session !== null && p_session !== undefined) && (p_session.status === 'connected')) 
					{
						if (p_session.m_unit.m_Video.m_videoTracks.length < 2) {
							fn_VIDEO_login(p_session, p_session.m_unit.m_Video.m_videoTracks[0].id);
							return;
						}
						else
						{
							js_eventEmitter.fn_dispatch (js_globals.EE_displayStreamDlgForm, p_session);
						}
					}
				}
        
        		js_globals.v_andruavClient.API_requestCameraList(p_andruavUnit, fn_callback);
		}


		/**
		   Switch Video OnOff
		*/
		export function toggleRecrodingVideo(p_andruavUnit) {

			if (p_andruavUnit === null || p_andruavUnit === undefined) return;

			function fn_callback (p_session)
        	{
				if ((p_session !== null && p_session !== undefined) && (p_session.status === 'connected')) {
					
					if (p_session.m_unit.m_Video.m_videoTracks.length < 2) {
						// backward compatibility ANdruav style.
						fn_VIDEO_Record(p_session, p_session.m_unit.m_Video.m_videoTracks[0].id, (p_session.m_unit.m_Video.m_videoTracks[0].r !=true));
						return;
					}
					else
					{
						js_eventEmitter.fn_dispatch (js_globals.EE_displayStreamDlgForm, p_session);
					}
				}
        	}
        
        	js_globals.v_andruavClient.API_requestCameraList(p_andruavUnit, fn_callback);
		}


		/**
		   return should be good & bad in the same time for different fences.
		*/
		export function fn_isBadFencing(p_andruavUnit) {

			var keys = Object.keys(js_globals.v_andruavClient.andruavGeoFences);
			var size = Object.keys(js_globals.v_andruavClient.andruavGeoFences).length;

			/* 
				bit 0: out of green zone
				bit 1: in bad zone
				bit 2: in good zone
			*/
			var v_res = 0b00; // bit 1 is good & bit 0 is for bad
			for (var i = 0; i < size; ++i) {
				var fence = js_globals.v_andruavClient.andruavGeoFences[keys[i]];

				if ((fence.Units !== null && fence.Units !== undefined) && (fence.Units.hasOwnProperty(p_andruavUnit.partyID))) {
					var geoFenceHitInfo = fence.Units[p_andruavUnit.partyID].geoFenceHitInfo;
					if (geoFenceHitInfo !== null && geoFenceHitInfo !== undefined) {

						if (geoFenceHitInfo.hasValue === true) {
							if (geoFenceHitInfo.m_inZone && geoFenceHitInfo.m_shouldKeepOutside) {
								// violation
								v_res = v_res | 0b010; //bad
							}
							if (geoFenceHitInfo.m_inZone && !geoFenceHitInfo.m_shouldKeepOutside) {  // this is diddferent than commented one ... if in zone & should be m_inZone then ok
								// no Violation
								v_res = v_res | 0b100; // good
							}
							if (!geoFenceHitInfo.m_inZone && !geoFenceHitInfo.m_shouldKeepOutside) {  // this is diddferent than commented one ... if in zone & should be m_inZone then ok
								// no Violation
								v_res = v_res | 0b001; // not in greed zone   
							}
						}
						else {

							if (geoFenceHitInfo.m_shouldKeepOutside === true) {
								// because no HIT Event is sent when Drone is away of a Restricted Area.
								// it is only send when it cross it in or out or being in at first.
								// for green area a hit command is sent when being out for every green area.
								v_res = v_res | 0b100;
							}
						}
					}
				}
			}
			return v_res;
		}


		/***
		* Hide but does not delete 
		***/
		function hlp_deleteOldWayPointOfDrone(p_andruavUnit) {
			if (p_andruavUnit.m_wayPoint === null || p_andruavUnit.m_wayPoint === undefined) return;
			var markers = p_andruavUnit.m_gui.m_wayPoint_markers;
			if (markers === null || markers === undefined) return;

			var count = markers.length;
			for (var i = 0; i < count; i++) {
				var marker = markers[i];
				js_leafletmap.fn_hideItem (marker);
			}

			var polygons = p_andruavUnit.m_gui.m_wayPoint_polygons;
			if (polygons !== null && polygons !== undefined) {
				count = polygons.length;
				for (var i = 0; i < count; i++) {
					var polygon = polygons[i];
					js_leafletmap.fn_hideItem(polygon);
				}
			}

			var polylines = p_andruavUnit.m_wayPoint.polylines;
			if (polylines !== null && polygons !== undefined) {
				js_leafletmap.fn_hideItem(p_andruavUnit.m_wayPoint.polylines);
				//p_andruavUnit.m_wayPoint.polylines.setMap(null);
			}
		}
		function gui_setVisibleMarkersByVehicleType(vehicleType, visible) {
			var keys = js_globals.m_andruavUnitList.fn_getUnitKeys();
			var size = keys.length;

			for (var i = 0; i < size; ++i) {

				var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(keys[i]);
				if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
					if (p_andruavUnit.m_VehicleType === vehicleType) {
						var marker = p_andruavUnit.m_gui.m_marker;
						if (marker !== null && marker !== undefined) {
							marker.setVisible(visible);
						}
					}
				}
			}
		}


		export function hlp_getFlightMode(p_andruavUnit) {
			//These are Andruav flight modes not Ardupilot flight modes. They are mapped in mavlink plugin
			var text = "undefined";
			if (p_andruavUnit.m_flightMode !== null && p_andruavUnit.m_flightMode !== undefined) {
				switch (p_andruavUnit.m_flightMode) {
					case js_andruavUnit.CONST_FLIGHT_CONTROL_RTL:
						text = "RTL";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_SMART_RTL:
						text = "Smart RTL";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_FOLLOW_ME:
						text = "Follow Me";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_FOLLOW_UNITED:
						text = "Follow Me";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO:
						text = "Auto";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_STABILIZE:
						text = "Stabilize";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_ALT_HOLD:
						text = "Hold";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_MANUAL:
						text = "Manual";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_ACRO:
						text = "Acro";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_TAKEOFF:
						text = "Takeoff";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED:
						text = "Guided";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_LOITER:
						text = "Loiter";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_POSTION_HOLD:
						text = "Pos-Hold";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_LAND:
						text = "Land";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_CIRCLE:
						text = "Circle";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_CRUISE:
						text = "Cruise";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_FBWA:
						text = "FBW A";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_FBWB:
						text = "FBW B";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_BRAKE:
						text = "Brake";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_HOLD:
						text = "Hold";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_SURFACE:
						text = "Surface";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_QHOVER:
						text = "QHover";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_QLOITER:
						text = "QLoiter";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_QSTABILIZE:
						text = "QStabilize";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_QLAND:
						text = "QLand";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_QRTL:
						text = "QRTL";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_INITIALIZE:
						text = "Initializing";
						break;
					case js_andruavUnit.CONST_FLIGHT_MOTOR_DETECT:
						text = "Motor Detect";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_MANUAL:
						text = "Manual";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_ALT_HOLD:
						text = "Alt-Hold";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_TAKEOFF:
						text = "Takeoff";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_MISSION:
						text = "Mission";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD:
						text = "Hold";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_RTL:
						text = "RTL";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_LAND:
						text = "Land";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_FOLLOW_TARGET:
						text = "Follow";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_AUTO_PRECLAND:
						text = "Precland";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_VTOL_TAKEOFF:
						text = "VT-Takeoff";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_ACRO:
						text = "Acro";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_STABILIZE:
						text = "Stabilize";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_OFF_BOARD:
						text = "Off-Board";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_RATTITUDE:
						text = "R-ATT";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_POSCTL_POSCTL:
						text = "Pos-Ctrl";
						break;
					case js_andruavUnit.CONST_FLIGHT_PX4_POSCTL_ORBIT:
						text = "Orbit";
						break;
					case js_andruavUnit.CONST_FLIGHT_CONTROL_UNKNOWN:
					default:
						text = "Unknown";
						break;
					}
				}
			return text;
		}


		function hlp_generateFlyHereMenu( lat, lng ) {

			return "<div id='context_menu_here' class='margin_zero padding_zero row'/>";
		}

		// function hlp_generateFlyHereMenu( lat, lng ) {
			
		// 	if (js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) {
		// 	  return <div/>;
		// 	}
		  
		// 	window.v_contextMenuOpen = true;
		  
		// 	const keys = js_globals.m_andruavUnitList.fn_getUnitKeys();
		// 	const size = keys.length;
		// 	let v_contextHTML = (
		// 	  <div className="test-justified">
		// 		<p className="bg-success text-white">
		// 		  <span className="text-success margin_zero text-white">
		// 			lat: {lat.toFixed(6)} lng: {lng.toFixed(6)}
		// 		  </span>
		// 		</p>
		// 		<div className="row">
		// 		  <div className="col-sm-12">
		// 			<p
		// 			  className="cursor_hand text-primary margin_zero si-07x"
		// 			  onClick={() =>
		// 				window.open(
		// 				  `./mapeditor.html?zoom=${js_leafletmap.fn_getZoom()}&lat=${lat}&lng=${lng}`,
		// 				  '_blank'
		// 				)
		// 			  }
		// 			>
		// 			  Open Geo Fence Here
		// 			</p>
		// 		  </div>
		// 		</div>
		// 	  </div>
		// 	);
		  
		// 	let v_contextMenu ;
		// 	let v_menuitems = 0;
		  
		// 	if (size === 0) {
		// 	  v_menuitems = 0;
		// 	} else {
		// 	  let sortedPartyIDs;
		// 	  if (js_localStorage.fn_getUnitSortEnabled()) {
		// 		// Sort the array alphabetically
		// 		sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSortedBy_APID();
		// 	  } else {
		// 		sortedPartyIDs = js_globals.m_andruavUnitList.fn_getUnitsSorted();
		// 	  }
		  
		// 	  sortedPartyIDs.forEach(([partyID]) => {
		// 		const p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(partyID);
		// 		if (
		// 		  p_andruavUnit &&
		// 		  !p_andruavUnit.m_IsGCS &&
		// 		  ((p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_ROVER) ||
		// 			(p_andruavUnit.m_VehicleType === js_andruavUnit.VEHICLE_BOAT)) &&
		// 		  (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED ||
		// 			p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO ||
		// 			p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD)
		// 		) {
		// 		  v_contextMenu = (
		// 			<div className="row">
		// 			  <div className="col-sm-12">
		// 				<p className="bg-primary text-white si-07x">
		// 				  {p_andruavUnit.m_unitName} {p_andruavUnit.m_VehicleType_TXT}
		// 				</p>
		// 			  </div>
		// 			  <div className="col-6">
		// 				<p
		// 				  className="cursor_hand margin_zero text-primary si-07x"
		// 				  onClick={() =>
		// 					window.fn_doFlyHere(
		// 					  p_andruavUnit.partyID,
		// 					  lat,
		// 					  lng,
		// 					  p_andruavUnit.m_Nav_Info.p_Location.alt
		// 					)
		// 				  }
		// 				>
		// 				  Goto Here
		// 				</p>
		// 			  </div>
		// 			  <div className="col-6">
		// 				<p
		// 				  className="cursor_hand margin_zero text-primary si-07x"
		// 				  onClick={() =>
		// 					window.fn_doSetHome(
		// 					  p_andruavUnit.partyID,
		// 					  lat,
		// 					  lng,
		// 					  p_andruavUnit.m_Nav_Info.p_Location.alt_abs
		// 					)
		// 				  }
		// 				>
		// 				  Set Home
		// 				</p>
		// 			  </div>
		// 			</div>
		// 		  );
		// 		  v_menuitems += 1;
		// 		} else if (
		// 		  p_andruavUnit &&
		// 		  !p_andruavUnit.m_IsGCS &&
		// 		  (p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_GUIDED ||
		// 			p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_CONTROL_AUTO ||
		// 			p_andruavUnit.m_flightMode === js_andruavUnit.CONST_FLIGHT_PX4_AUTO_HOLD)
		// 		) {
		// 		  v_contextMenu = (
		// 			<div className="row css_txt_center">
		// 			  <div className="col-sm-12">
		// 				<p className="bg-primary text-white si-07x">
		// 				  {p_andruavUnit.m_unitName} {p_andruavUnit.m_VehicleType_TXT}
		// 				</p>
		// 			  </div>
		// 			  <div className="col-4 padding_zero">
		// 				<p
		// 				  className="cursor_hand margin_zero text-primary si-07x"
		// 				  onClick={() =>
		// 					fn_doCircle2(
		// 					  p_andruavUnit.partyID,
		// 					  lat,
		// 					  lng,
		// 					  fn_convertToMeter(js_globals.CONST_DEFAULT_ALTITUDE),
		// 					  fn_convertToMeter(js_globals.CONST_DEFAULT_RADIUS),
		// 					  10
		// 					)
		// 				  }
		// 				>
		// 				  Circle
		// 				</p>
		// 			  </div>
		// 			  <div className="col-4 padding_zero">
		// 				<p
		// 				  className="cursor_hand margin_zero text-primary si-07x"
		// 				  onClick={() =>
		// 					fn_doFlyHere(
		// 					  p_andruavUnit.partyID,
		// 					  lat,
		// 					  lng,
		// 					  p_andruavUnit.m_Nav_Info.p_Location.alt
		// 					)
		// 				  }
		// 				>
		// 				  Goto Here
		// 				</p>
		// 			  </div>
		// 			  <div className="col-4 padding_zero">
		// 				<p
		// 				  className="cursor_hand margin_zero text-primary si-07x"
		// 				  onClick={() =>
		// 					fn_doSetHome(
		// 					  p_andruavUnit.partyID,
		// 					  lat,
		// 					  lng,
		// 					  p_andruavUnit.m_Nav_Info.p_Location.alt_abs
		// 					)
		// 				  }
		// 				>
		// 				  Set Home
		// 				</p>
		// 			  </div>
		// 			</div>
		// 		  );
		// 		  v_menuitems += 1;
		// 		}
		// 	  });
		// 	}
		  
		// 	v_contextHTML += v_contextMenu;
		// 	if (v_menuitems === 0) {
		// 	  v_contextHTML += (
		// 		<div className="row">
		// 		  <div className="col-sm-12">
		// 			<p className="text-warning">No Guided Mode Vechiles</p>
		// 		  </div>
		// 		</div>
		// 	  );
		// 	}
		  
		// 	v_contextHTML += </div>;
		// 	return v_contextHTML;
		//   }




		function fn_generateContextMenuHTML(v_lat, v_lng)
		{
			$('.contextmenu').remove(); //remove previous context menus
			if (v_contextMenuOpen === true) 
			{
				v_contextMenuOpen = false;
				return ;
			}

			js_leafletmap.fn_showInfoWindow2(null,  hlp_generateFlyHereMenu(v_lat, v_lng),v_lat, v_lng);
			const root = ReactDOM.createRoot(window.document.getElementById('context_menu_here'));
			root.render(<Clss_MainContextMenu p_lat={v_lat} p_lng={v_lng} />);
		}

		export function fn_contextMenu( p_position) {
			// use JS Dom methods to create the menu
			// use event.pixel.x and event.pixel.y 
			// to position menu at mouse position

			if (js_globals.m_markGuided !== null && js_globals.m_markGuided !== undefined) {
				js_leafletmap.fn_hideItem(js_globals.m_markGuided);
				js_globals.m_markGuided = null;
			}
			
            js_globals.m_markGuided = js_leafletmap.fn_CreateMarker ('./images/waypoint_bg_32x32.png', 'target', [16,16], true, true);
            js_leafletmap.fn_setPosition(js_globals.m_markGuided , p_position);
			
			js_leafletmap.fn_addListenerOnClickMarker (js_globals.m_markGuided,
				
				function (p_lat, p_lng) {

					fn_generateContextMenuHTML(p_lat, p_lng);
				});

			//fn_generateContextMenuHTML(js_leafletmap.fn_getLocationObjectBy_latlng(p_lat, p_lng));
		};

		/////////////////////////////////////////////////////////////////////////////// MAP Functions
		var map = null;
		var infowindow = null;
		function initMap() {
			
			js_leafletmap.fn_initMap('mapid');
			fn_setLapout();
			fn_gps_getLocation();

		};


		function resetzoom() {
			js_leafletmap.setZoom(2);
		}

		/////////////////////////////////////////////////////////////////////////////// Events from AndruavClient

		// Websocket Connection established
		var EVT_onOpen = function () {
			$('#andruavUnitGlobals').show();

			js_globals.v_connectState = true;
			js_globals.v_connectRetries = 0;
		}

		// called when Websocket Closed
		var EVT_onClose = function () {


			if (js_globals.v_andruavClient !== null && js_globals.v_andruavClient !== undefined) {
				js_globals.v_andruavClient.fn_disconnect();
				js_globals.v_andruavClient = null;
			}

			if (js_globals.v_connectState === true) {

				js_globals.v_connectRetries += 1;
				if (js_globals.v_connectRetries >= 5) {
					js_speak.fn_speak('Disconnected');
				}
				setTimeout(fn_connect, 4000);
			}
			else {
				js_speak.fn_speak('Disconnected');
			}
		};

		

		function fn_onSocketStatus(me,event) {
			const name = event.name;
			const status = event.status;
			js_eventEmitter.fn_dispatch( js_globals.EE_onSocketStatus, event);
			
			if (status === js_andruavMessages.CONST_SOCKET_STATUS_REGISTERED) {
				js_speak.fn_speak('Connected');

				if (js_globals.CONST_MAP_EDITOR===true)
				{
					js_globals.v_andruavClient.API_loadGeoFence (js_andruavAuth.m_username,js_globals.v_andruavClient.m_groupName,null,'_drone_',1);
				}
			}
			else {

			}
		};


		export function fn_putWayPoints(p_andruavUnit, p_eraseFirst) {

			var files = window.document.getElementById('btn_filesWP').files;
			if (p_andruavUnit === null || p_andruavUnit === undefined) return ;

			if (!files.length) {
				alert('Please select a file!');
				return;
			}

			var file = files[0];

			var reader = new FileReader();

			// If we use onloadend, we need to check the readyState.
			reader.onloadend = function (evt) {
				if (evt.target.readyState === FileReader.DONE) { // DONE == 2
					js_globals.v_andruavClient.API_uploadWayPoints(p_andruavUnit, p_eraseFirst, evt.target.result);
				}
			};

			if (js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) return;

			reader.readAsBinaryString(file);
		}


		


		

		var EVT_GCSDataReceived = function (data) {
			if ((js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) || (js_globals.v_andruavClient.currentTelemetryUnit === null || js_globals.v_andruavClient.currentTelemetryUnit === undefined)) {
				return;
			}
			js_globals.v_andruavClient.API_SendTelemetryData(js_globals.v_andruavClient.currentTelemetryUnit, data);
		};

		var EVT_GCSDataOpen = function (data) {
			js_eventEmitter.fn_dispatch(js_globals.EE_onGUIMessageHide);
		};


		var EVT_BadMavlink = function () {
			//gui_alert('Web Telemetry', 'Please make sure that you use MAVLINK <b>version 2</b>.', 'danger');
			js_eventEmitter.fn_dispatch(js_globals.EE_onGUIMessage, {
				p_title:'Web Telemetry',
				p_msg:'Please make sure that you use MAVLINK <b>version 2</b>.',
				p_level:'danger'
			});

		};




		var EVT_onDeleted = function () {
			js_globals.v_andruavClient.fn_disconnect();
			js_globals.v_andruavClient = null;
		};



		var EVT_msgFromUnit_WayPointsUpdated = function (me, data) {

			const p_andruavUnit = data.unit;
			const missionIndexReached = data.mir;
			const status = data.status;

			if (p_andruavUnit.m_wayPoint === null || p_andruavUnit.m_wayPoint === undefined) {
				//no waypoint attached ... send asking for update
				js_globals.v_andruavClient.API_requestWayPoints(p_andruavUnit);

				return;
			}

			if (p_andruavUnit.m_gui.m_wayPoint_markers !== null && p_andruavUnit.m_gui.m_wayPoint_markers !== undefined) {
				const c_mission_index = missionIndexReached;
				var v_marker = p_andruavUnit.m_gui.m_wayPoint_markers[c_mission_index];
				if (v_marker !== null && v_marker !== undefined) {
					v_marker.waypoint_status = status;
					if ((p_andruavUnit.m_wayPoint.wayPointPath[c_mission_index]==js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_TRIGGER)
					|| (p_andruavUnit.m_wayPoint.wayPointPath[c_mission_index]==js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_CONTROL)) {
						switch (status) {
							case js_andruavMessages.CONST_Report_NAV_ItemReached:
								js_leafletmap.fn_setMarkerIcon(v_marker, './images/camera_24x24.png', false, false, null, [16,16]);
								break;
							case js_andruavMessages.CONST_Report_NAV_ItemUnknown:
								js_leafletmap.fn_setMarkerIcon(v_marker, './images/camera_gy_32x32.png', false, false, null, [16,16]);
								break;
							case js_andruavMessages.CONST_Report_NAV_ItemExecuting:
								js_leafletmap.fn_setMarkerIcon(v_marker, './images/camera_bg_32x32.png', false, false, null, [16,16]);
								break;
						}
					}
					else {
						switch (status) {
							case js_andruavMessages.CONST_Report_NAV_ItemReached:
								p_andruavUnit.m_Nav_Info._Target.wp_num = c_mission_index + 1;
								js_leafletmap.fn_setMarkerIcon(v_marker, './images/location_gy_32x32.png');
								break;
							case js_andruavMessages.CONST_Report_NAV_ItemUnknown:
								js_leafletmap.fn_setMarkerIcon(v_marker, './images/location_bb_32x32.png');
								break;
							case js_andruavMessages.CONST_Report_NAV_ItemExecuting:
								js_leafletmap.fn_setMarkerIcon(v_marker, './images/location_bg_32x32.png');
								break;

						}
					}
				}
			}
		}

		var EVT_msgFromUnit_WayPoints = function (me, data) {
			const p_andruavUnit = data.unit;
			const wayPointArray = data.wps;

			// TODO HERE >>> DELETE OLD WAYPOINTS AND HIDE THEM FROM MAP
			var LngLatPoints = [];

			hlp_deleteOldWayPointOfDrone(p_andruavUnit);

			p_andruavUnit.m_wayPoint = {};
			p_andruavUnit.m_wayPoint.wayPointPath = wayPointArray;
			p_andruavUnit.m_gui.m_wayPoint_markers = [];
			p_andruavUnit.m_gui.m_wayPoint_polygons = [];

			if (wayPointArray.length === 0) return;
			var latlng = null;
			for (var i = 0; i < wayPointArray.length; ++i) {
				var subIcon = false;	
				var wayPointStep = wayPointArray[i];
				var icon_img = './images/location_bb_32x32.png';
				switch (wayPointStep.waypointType) {
					case js_andruavMessages.CONST_WayPoint_TYPE_WAYPOINTSTEP:
						latlng = js_leafletmap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
						icon_img = './images/location_bb_32x32.png';
						wayPointStep.m_label = "WP";
						break;
					case js_andruavMessages.CONST_WayPoint_TYPE_SPLINE:
						latlng = js_leafletmap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
						icon_img = './images/location_bb_32x32.png';
						wayPointStep.m_label = "Spline";
						break;
					case js_andruavMessages.CONST_WayPoint_TYPE_TAKEOFF:
						//icon_img = './images/plane_b_32x32.png';
						wayPointStep.m_label = "Takeoff";
						break;
					case js_andruavMessages.CONST_WayPoint_TYPE_LANDING:
						wayPointStep.m_label = "Land";
						break;
					case js_andruavMessages.CONST_WayPoint_TYPE_RTL:
						wayPointStep.m_label = "RTL";
						break;
					case js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_TRIGGER:
						latlng = js_leafletmap.fn_getLocationObjectBy_latlng(latlng.lat+0.00001, latlng.lng+0.00001);
						icon_img = './images/camera_gy_32x32.png';
						subIcon = true;
						wayPointStep.m_label = "CAM";
						break;
					case js_andruavMessages.CONST_WayPoint_TYPE_CAMERA_CONTROL:
						latlng = js_leafletmap.fn_getLocationObjectBy_latlng(latlng.lat+0.00001, latlng.lng+0.00001);
						icon_img = './images/camera_gy_32x32.png';
						subIcon = true;
						wayPointStep.m_label = "CAM";
						break;
					case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE:
						latlng = js_leafletmap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
						icon_img = './images/location_bb_32x32.png';
						wayPointStep.m_label = "Loiter in Circles";
						var v_circleMission = js_leafletmap.fn_drawMissionCircle(latlng,wayPointStep.m_Radius);
						// var circleMission = new google.maps.Circle({
						// 	fillColor: '#3232CD',
						// 	strokeOpacity: 1.0,
						// 	strokeWeight: 0,
						// 	map: map,
						// 	fillOpacity: 0.25,
						// 	center: latlng,
						// 	radius: parseInt(wayPointStep.m_Radius)
						// });
						// circleMission.setMap(map);
						p_andruavUnit.m_gui.m_wayPoint_polygons.push(v_circleMission);
						break;
					default:
						continue;
				}


				if (latlng !== null && latlng !== undefined) {
					var v_iconsize = [32,32];
					if (subIcon==true) {
						v_iconsize = [16,16];
					}
					var v_mark = js_leafletmap.fn_CreateMarker(icon_img, p_andruavUnit.m_unitName + "  step: " + wayPointStep.m_Sequence, [16,24], false, false, null, v_iconsize);
					js_leafletmap.fn_setPosition(v_mark, latlng);
					p_andruavUnit.m_gui.m_wayPoint_markers.push(v_mark);
					v_mark.wayPointStep = wayPointStep;

					
					function fn_clickHandler(w, u) {
						js_leafletmap.fn_addListenerOnClickMarker (v_mark,
						function (p_lat, p_lng) {
							fn_showWaypointInfo(p_lat, p_lng, w, u);
						});
					}

					fn_clickHandler(wayPointStep, p_andruavUnit);

					if (subIcon==false) {
						LngLatPoints.push(latlng);
					}
				}


			}

			if (LngLatPoints.length > 0) {
				p_andruavUnit.m_wayPoint.polylines = js_leafletmap.fn_drawMissionPolyline(LngLatPoints, js_globals.flightPath_colors[p_andruavUnit.m_index%4]);
			}
		}


		
		function EVT_andruavUnitFCBUpdated(me, p_andruavUnit) {
			if (p_andruavUnit.m_useFCBIMU === true) {
				js_speak.fn_speak(p_andruavUnit.m_unitName + ' connected to flying board');
				js_globals.v_andruavClient.API_requestParamList(p_andruavUnit);
			}
			else {
				js_speak.fn_speak(p_andruavUnit.m_unitName + ' disconnected from flying board');
			}
		}

		function EVT_andruavUnitFlyingUpdated(me, p_andruavUnit) {
			if (p_andruavUnit.m_isFlying === true) {
				js_speak.fn_speak(p_andruavUnit.m_unitName + ' is Flying');
			}
			else {
				js_speak.fn_speak(p_andruavUnit.m_unitName + ' is on ground');
			}
		}




		function EVT_andruavUnitFightModeUpdated(me, p_andruavUnit) {
			if (p_andruavUnit.m_IsGCS !== true) {
				var text = hlp_getFlightMode(p_andruavUnit);
				js_speak.fn_speak(p_andruavUnit.m_unitName + ' flight mode is ' + text);
			}
		}


		function changedeg(element, degree) {
			if (navigator.userAgent.match("Chrome")) {
				element.style.WebkitTransform = "rotate(" + degree + "deg)";
			}
			else if (navigator.userAgent.match("Firefox")) {
				element.style.MozTransform = "rotate(" + degree + "deg)";
			}
			else if (navigator.userAgent.match("MSIE")) {
				element.style.msTransform = "rotate(" + degree + "deg)";
			}
			else if (navigator.userAgent.match("Opera")) {
				element.style.OTransform = "rotate(" + degree + "deg)";
			}
			else {
				element.style.transform = "rotate(" + degree + "deg)";
			}
		}

		function EVT_andruavUnitVehicleTypeUpdated(me, p_andruavUnit) {
			const v_htmlTitle = "<p class='text-white margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
			js_leafletmap.fn_setVehicleIcon(p_andruavUnit.m_gui.m_marker, getVehicleIcon(p_andruavUnit, (js_globals.CONST_MAP_GOOLE === true)), p_andruavUnit.m_unitName,null, false,false, v_htmlTitle,[64,64]) ;
		}

		
		function EVT_andruavUnitArmedUpdated(me, p_andruavUnit) {
			
			if (p_andruavUnit.m_isArmed) {
				js_speak.fn_speak('ARMED');
			}
			else {
				js_speak.fn_speak('Disarmed');
			}

			js_eventEmitter.fn_dispatch( js_globals.EE_unitUpdated, p_andruavUnit);
		}


		function getDestinationPointIcon (p_point_type, p_vehicle_index)
		{
			switch (p_point_type)
			{
				case js_andruavMessages.CONST_DESTINATION_GUIDED_POINT:
				return './images/destination_bg_32x32.png';
				case js_andruavMessages.CONST_DESTINATION_SWARM_MY_LOCATION:
				return js_globals.swarm_location_icon[p_vehicle_index];
			}
		}

		function getPlanIcon(bearingIndex, vehicle_index) {
			return js_globals.planes_icon[vehicle_index];
			switch (bearingIndex) {
				case 0:
				case 1:
					return './images/planetracker_r_0d_.png';
					break;
				case 2:
				case 3:
					return './images/planetracker_r_45d_.png';
					break;
				case 4:
				case 5:
					return './images/planetracker_r_90_.png';
					break;
				case 6:
				case 7:
					return './images/planetracker_r_135d_.png';
					break;
				case -8:
				case -7:
					return './images/planetracker_r_180d_.png';
					break;
				case -6:
				case -5:
					return './images/planetracker_r_225d_.png';
					break;
				case -4:
				case -3:
					return './images/planetracker_r_270d_.png';
					break;
				case -2:
				case -1:
					return './images/planetracker_r_315d_.png';
					break;
				default:
					return './images/planetracker_r_0d_.png';
					break;


			}
		}

		export function getVehicleIcon(p_andruavUnit, applyBearing) {


			if (p_andruavUnit.m_IsGCS === true) {
				return './images/map_gcs_3_32x32.png';
			}
			else {

				switch (p_andruavUnit.m_VehicleType) {
					case js_andruavUnit.VEHICLE_TRI:
						p_andruavUnit.m_VehicleType_TXT = "Tricopter";
						return js_globals.quad_icon[p_andruavUnit.m_index%4];
					case js_andruavUnit.VEHICLE_QUAD:
						p_andruavUnit.m_VehicleType_TXT = "Quadcopter";
						return js_globals.quad_icon[p_andruavUnit.m_index%4];
					case js_andruavUnit.VEHICLE_PLANE:
						p_andruavUnit.m_VehicleType_TXT = "Fixed Wings";
						return js_globals.planes_icon[p_andruavUnit.m_index%4];
					case js_andruavUnit.VEHICLE_HELI:
						p_andruavUnit.m_VehicleType_TXT = "Heli";
						return './images/heli_1_32x32.png';
					case js_andruavUnit.VEHICLE_ROVER:
						p_andruavUnit.m_VehicleType_TXT = "Rover";
						return js_globals.rover_icon[p_andruavUnit.m_index%4];
					case js_andruavUnit.VEHICLE_BOAT:
						p_andruavUnit.m_VehicleType_TXT = "Boat";
						return js_globals.boat_icon[p_andruavUnit.m_index%4];
					case js_andruavUnit.VEHICLE_SUBMARINE:
						p_andruavUnit.m_VehicleType_TXT = "Submarine";
						return './images/submarine_gb_32x32.png';
						
						default:
						return './images/drone_3_32x32.png';
				}
			}
		}

		/**
		   Called when message [js_andruavMessages.CONST_TYPE_AndruavMessage_GPS] is received from a UNIT or GCS holding IMU Statistics
		 */
		function EVT_msgFromUnit_GPS(me, p_andruavUnit) {
			function getLabel() {
				return p_andruavUnit.m_unitName;
			}

			
			if ((p_andruavUnit.m_defined ===true) && (p_andruavUnit.m_Nav_Info.p_Location.lat !== null && p_andruavUnit.m_Nav_Info.p_Location.lat !== undefined)) {
				
				if (p_andruavUnit.m_gui.m_marker === null || p_andruavUnit.m_gui.m_marker === undefined)
				{
					if (js_globals.v_vehicle_gui[p_andruavUnit.partyID]!== null && js_globals.v_vehicle_gui[p_andruavUnit.partyID] !== undefined)
					{
						p_andruavUnit.m_gui = js_globals.v_vehicle_gui[p_andruavUnit.partyID];
					}
				}
				
				var marker = p_andruavUnit.m_gui.m_marker;

				if (js_globals.CONST_DISABLE_ADSG === false) {
					js_adsbUnit.fn_getADSBDataForUnit(p_andruavUnit);
				}
				
				var v_image =  getVehicleIcon(p_andruavUnit, (js_globals.CONST_MAP_GOOLE === true));

				if (marker === null || marker === undefined) {
					// create a buffer for flight path
					p_andruavUnit.m_gui.m_gui_flightPath.fn_flush();
					p_andruavUnit.m_gui.m_flightPath_style = {
															color: js_globals.flightPath_colors[p_andruavUnit.m_index%4],
															opacity: 0.8,
															weight: 5,
															dashArray: '5, 5'
															};


					/*
						v_htmlTitle: Valid only for Leaflet
					*/
					var v_htmlTitle = "<p class='text-white margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
					// Add new Vehicle
					p_andruavUnit.m_gui.m_marker = js_leafletmap.fn_CreateMarker(v_image, getLabel(),null, false,false, v_htmlTitle,[64,64]) ;
					js_globals.v_vehicle_gui[p_andruavUnit.partyID]  = p_andruavUnit.m_gui;
					
					js_leafletmap.fn_addListenerOnClickMarker (p_andruavUnit.m_gui.m_marker,
						function (p_lat, p_lng) {
							var id = '#h'+p_andruavUnit.partyID +' a';
							var tabTrigger = new bootstrap.Tab(id);
							bootstrap.Tab.getInstance(id).show()
							fn_showAndruavUnitInfo(p_lat, p_lng, p_andruavUnit);
							infowindow2.m_ignoreMouseOut = true;
						});
					
					js_leafletmap.fn_addListenerOnMouseOverMarker (p_andruavUnit.m_gui.m_marker,
						function (p_lat, p_lng) {
							js_leafletmap.fn_addListenerOnMouseOutClickMarker (p_andruavUnit.m_gui.m_marker,
								function (p_lat, p_lng) {
									js_leafletmap.fn_removeListenerOnMouseOutClickMarker(p_andruavUnit.m_gui.m_marker);
									if ((infowindow2==null) || (!infowindow2.hasOwnProperty('m_ignoreMouseOut')) || (infowindow2.m_ignoreMouseOut!==true))
									{
										js_leafletmap.fn_hideInfoWindow(infowindow2);
									}
							});

							fn_showAndruavUnitInfo(p_lat, p_lng, p_andruavUnit);
						});
				}
				else {
					// DRAW path
					if (p_andruavUnit.m_Nav_Info.p_Location.oldlat !== null && p_andruavUnit.m_Nav_Info.p_Location.oldlat  !== undefined) {
						var v_distance = js_helpers.fn_calcDistance(
							p_andruavUnit.m_Nav_Info.p_Location.oldlat,
							p_andruavUnit.m_Nav_Info.p_Location.oldlng,
							p_andruavUnit.m_Nav_Info.p_Location.lat,
							p_andruavUnit.m_Nav_Info.p_Location.lng);
						if (v_distance > 1000) {
							p_andruavUnit.m_Nav_Info.p_Location.oldlat = p_andruavUnit.m_Nav_Info.p_Location.lat;
							p_andruavUnit.m_Nav_Info.p_Location.oldlng = p_andruavUnit.m_Nav_Info.p_Location.lng;
							p_andruavUnit.m_Nav_Info.p_Location.oldalt = p_andruavUnit.m_Nav_Info.p_Location.alt;
						}
						else if (v_distance > 10) {
							var v_flightPath = js_leafletmap.fn_DrawPath(
										p_andruavUnit.m_Nav_Info.p_Location.oldlat,
										p_andruavUnit.m_Nav_Info.p_Location.oldlng,
										p_andruavUnit.m_Nav_Info.p_Location.lat,
										p_andruavUnit.m_Nav_Info.p_Location.lng,
										p_andruavUnit.m_gui.m_flightPath_style);

							// Add flight path step
							p_andruavUnit.m_gui.m_gui_flightPath.fn_add(v_flightPath, true,
								function (oldstep) {
									js_leafletmap.fn_hideItem(oldstep);
								});


							p_andruavUnit.m_Nav_Info.m_FlightPath.push(v_flightPath);
							p_andruavUnit.m_Nav_Info.p_Location.oldlat = p_andruavUnit.m_Nav_Info.p_Location.lat;
							p_andruavUnit.m_Nav_Info.p_Location.oldlng = p_andruavUnit.m_Nav_Info.p_Location.lng;
							p_andruavUnit.m_Nav_Info.p_Location.oldalt = p_andruavUnit.m_Nav_Info.p_Location.alt;
						}
					}
					else {
						p_andruavUnit.m_Nav_Info.p_Location.oldlat = p_andruavUnit.m_Nav_Info.p_Location.lat;
						p_andruavUnit.m_Nav_Info.p_Location.oldlng = p_andruavUnit.m_Nav_Info.p_Location.lng;
						p_andruavUnit.m_Nav_Info.p_Location.oldalt = p_andruavUnit.m_Nav_Info.p_Location.alt;
					}


				}
				js_leafletmap.fn_setIcon(p_andruavUnit.m_gui.m_marker, v_image);
				js_leafletmap.fn_setPosition_bylatlng(p_andruavUnit.m_gui.m_marker, p_andruavUnit.m_Nav_Info.p_Location.lat, p_andruavUnit.m_Nav_Info.p_Location.lng, p_andruavUnit.m_Nav_Info.p_Orientation.yaw);
				js_eventEmitter.fn_dispatch( js_globals.EE_unitUpdated, p_andruavUnit);
			}
			else {

			}
		}

		
		/**
		 Called when message [js_andruavMessages.CONST_TYPE_AndruavMessage_IMG] is received from a UNIT or GCS 
	   */
		function EVT_msgFromUnit_IMG(me, data) { //,p_andruavUnit, bin, description, latitude, logitude, gpsProvider, time, altitude, speed, bearing, accuracy) {

			if (data.img.length>0)
			{
				var blob = new Blob([data.img], { type: 'image/jpeg' });


				var reader = new FileReader();
				reader.onload = function (event) {
					var contents = event.target.result;
					$('#unitImg').data('binaryImage', contents);
					
					// Cleanup the reader object
					reader.abort();
                    reader = null;
					return;
				};

				reader.onerror = function (event) {
					console.p_error("File could not be read! Code " + event.target.p_error.code);
				};

				reader.readAsDataURL(blob);

				$('#unitImg').attr('src', 'data:image/jpeg;base64,' +js_helpers. fn_arrayBufferToBase64(data.img));
				$('#modal_fpv').show();
			}

			var latlng = js_leafletmap.fn_getLocationObjectBy_latlng(data.lat, data.lng);
			$('#unitImg').data('imgLocation', latlng);
			fn_showCameraIcon(latlng);
		}

		function fn_showCameraIcon(latlng) {
			var v_marker = js_leafletmap.fn_CreateMarker('./images/camera_24x24.png', 'image');
			js_leafletmap.fn_setPosition(v_marker,latlng);
		}

		function hlp_saveImage_html() {
			var contents = $('#unitImg').data('binaryImage');
			saveData(contents, 'image.jpg');

		}


		function hlp_gotoImage_Map() {
			var location = $('#unitImg').data('imgLocation');
			if (location !== null && location !== undefined) {
				// if (js_leafletmap.fn_getZoom() < 14) {
				// 	js_leafletmap.fn_setZoom(14);
				// }

				js_leafletmap.fn_PanTo(location);
			}
		}

		
		/**
		  Called when a new unit joins the system.
		*/
		var EVT_andruavUnitAdded = function (me, p_andruavUnit) {
			if (p_andruavUnit.m_IsGCS === false) {
				p_andruavUnit.m_gui.defaultHight = js_globals.CONST_DEFAULT_ALTITUDE;
				p_andruavUnit.m_gui.defaultCircleRadius = js_globals.CONST_DEFAULT_RADIUS;
			}
			
			js_speak.fn_speak(p_andruavUnit.m_unitName + " unit added");

			js_eventEmitter.fn_dispatch( js_globals.EE_unitAdded, p_andruavUnit);
			js_globals.v_andruavClient.API_requestIMU (p_andruavUnit,true);
		}	


		var EVT_HomePointChanged = function (me, p_andruavUnit) {
			var v_latlng = js_leafletmap.fn_getLocationObjectBy_latlng(p_andruavUnit.m_Geo_Tags.p_HomePoint.lat, p_andruavUnit.m_Geo_Tags.p_HomePoint.lng);

			if (p_andruavUnit.m_gui.m_marker_home === null || p_andruavUnit.m_gui.m_marker_home === undefined) {
				const v_html = "<p class='text-light margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
				var v_home = js_leafletmap.fn_CreateMarker('./images/home_b_24x24.png', p_andruavUnit.m_unitName, [16,24], false, false, v_html, [32,32]);
				js_leafletmap.fn_setPosition(v_home,v_latlng)
				p_andruavUnit.m_gui.m_marker_home = v_home;
				
				js_leafletmap.fn_addListenerOnClickMarker(v_home, 
					function (p_lat, p_lng) {
						setTimeout(function () {
						
							showAndruavHomePointInfo(p_lat, p_lng, p_andruavUnit);
						}, 300);
				});
			}

			js_leafletmap.fn_setPosition(p_andruavUnit.m_gui.m_marker_home,v_latlng);

		};


		var EVT_DistinationPointChanged = function (me, p_andruavUnit) {

    
			if (((js_siteConfig.CONST_FEATURE.DISABLE_SWARM_DESTINATION_PONTS===true) || (js_localStorage.fn_getAdvancedOptionsEnabled()!==true))
				&& (p_andruavUnit.m_Geo_Tags.p_DestinationPoint.type == js_andruavMessages.CONST_DESTINATION_SWARM_MY_LOCATION))
			{
				if (p_andruavUnit.m_gui.m_marker_destination!=null)
				{
					js_leafletmap.fn_hideItem(p_andruavUnit.m_gui.m_marker_destination);
					p_andruavUnit.m_gui.m_marker_destination = null;
					p_andruavUnit.m_Geo_Tags.p_DestinationPoint.m_needsIcon  = true;
				}
				return ;
			}
			var v_latlng = js_leafletmap.fn_getLocationObjectBy_latlng(p_andruavUnit.m_Geo_Tags.p_DestinationPoint.lat, p_andruavUnit.m_Geo_Tags.p_DestinationPoint.lng);

			if (p_andruavUnit.m_gui.m_marker_destination === null || p_andruavUnit.m_gui.m_marker_destination === undefined) {
				p_andruavUnit.m_gui.m_marker_destination = js_leafletmap.fn_CreateMarker('./images/destination_bg_32x32.png', "Target of: " + p_andruavUnit.m_unitName, [16,16]);
			}
			
			if (p_andruavUnit.m_Geo_Tags.p_DestinationPoint.m_needsIcon===true)
			{
				js_leafletmap.fn_setMarkerIcon(p_andruavUnit.m_gui.m_marker_destination, getDestinationPointIcon(p_andruavUnit.m_Geo_Tags.p_DestinationPoint.type, p_andruavUnit.m_index%4));
				p_andruavUnit.m_Geo_Tags.p_DestinationPoint.m_needsIcon = false;
			}
			
				
			js_leafletmap.fn_setPosition(p_andruavUnit.m_gui.m_marker_destination,v_latlng)
		};



		/**
		  Received when a notification sent by remote UNIT.
		  It could be p_error, warning or notification.
		  *******************
		  errorNo 			: 
   							    // 0	MAV_SEVERITY_EMERGENCY	System is unusable. This is a "panic" condition.
								// 1	MAV_SEVERITY_ALERT	Action should be taken immediately. Indicates p_error in non-critical systems.
								// 2	MAV_SEVERITY_CRITICAL	Action must be taken immediately. Indicates failure in a primary system.
								// 3	MAV_SEVERITY_ERROR	Indicates an p_error in secondary/redundant systems.
								// 4	MAV_SEVERITY_WARNING	Indicates about a possible future p_error if this is not resolved within a given timeframe. Example would be a low battery warning.
								// 5	MAV_SEVERITY_NOTICE	An unusual event has occurred, though not an p_error condition. This should be investigated for the root cause.
								// 6	MAV_SEVERITY_INFO	Normal operational messages. Useful for logging. No action is required for these messages.
								// 7	MAV_SEVERITY_DEBUG	Useful non-operational messages that can assist in debugging. These should not occur during normal operation.

		  infoType			:
								  ERROR_CAMERA 	= 1
								  ERROR_BLUETOOTH	= 2
								  ERROR_USBERROR	= 3
								  ERROR_KMLERROR	= 4
		  v_notification_Type	:
								  NOTIFICATIONTYPE_ERROR = 1;
								  NOTIFICATIONTYPE_WARNING = 2;
								  NOTIFICATIONTYPE_NORMAL = 3;
								  NOTIFICATIONTYPE_GENERIC = 0;
		  Description	'DS		: 
								  Messag
		*/
		var EVT_andruavUnitError = function (me, data) {
			const p_andruavUnit = data.unit;
			const p_error = data.err;
			
			var v_notification_Type;
			var v_cssclass = 'good';
			switch (p_error.notification_Type) {
				case 0:
					v_notification_Type = 'emergency';
					v_cssclass = 'error';
					break;
				case 1:
					v_notification_Type = 'alert';
					v_cssclass = 'error';
					break;
				case 2:
					v_notification_Type = 'critical';
					v_cssclass = 'error';
					break;
				case 3:
					v_notification_Type = 'error';
					v_cssclass = 'error';
					break;
				case 4:
					v_notification_Type = 'warning';
					v_cssclass = 'warning';
					break;
				case 5:
					v_notification_Type = 'notice';
					v_cssclass = 'good';
					break;
				case 6:
				v_notification_Type = 'info';
					v_cssclass = 'good';
					break;
				case 7:
					v_notification_Type = 'debug';
					v_cssclass = 'good';
					break;
			}
			const c_msg = {};
			c_msg.m_unit = p_andruavUnit;
			c_msg.m_notification_Type = v_notification_Type;
			c_msg.m_cssclass = v_cssclass;
			c_msg.m_error = p_error;
			js_eventEmitter.fn_dispatch( js_globals.EE_onMessage, c_msg);
		
			


			$('#message_notification').append("<div class='" + v_cssclass + "'>" + p_andruavUnit.m_unitName + ": " + p_error.Description + "</div>");

			if (p_error.infoType !== js_andruavMessages.CONST_INFOTYPE_GEOFENCE) {
				if (p_error.v_notification_Type <=3)
				{ 
					//http://github.hubspot.com/messenger/docs/welcome/
					// TODO: Replace Messenger REACT2
					// Messenger().post({
					// 	type: v_notification_Type,
					// 	message: p_andruavUnit.m_unitName + ":" + p_error.Description
					// });
					
					// only speak out errors
					js_speak.fn_speak(p_andruavUnit.m_unitName + ' ' + p_error.Description);
				}
			}
		};

		var infowindow2 = null
		var infowindowADSB = null;

		function fn_showAdSBInfo(event, _adsb) {
			// var armedBadge = "";
			// //if (p_andruavUnit.m_isArmed) armedBadge = '<span class="text-danger">&nbsp;armed&nbsp;</span>';
			// //else armedBadge = '<span class="text-success">&nbsp;disarmed&nbsp;</span>';
			// //if (p_andruavUnit.m_isFlying) armedBadge += '<span class="text-danger">&nbsp;flying&nbsp;</span>';
			// //else armedBadge += '<span class="text-success">&nbsp;on-ground&nbsp;</span>';

			// var markerContent = "<p class='img-rounded bg-primary'><strong> Icao " + _adsb.Icao + "</strong></p>\
			//   	<p class='img-rounded help-block'>" + _adsb.ModelDescription + "</p>";

			// markerContent += "<p> <span class='text-success'>Speed: " + Number(_adsb.Speed.toFixed(0)).toLocaleString() + " Km/hr </span> </p>";

			// var alt;
			// if (js_globals.v_useMetricSystem === true) {
			// 	alt = Number(_adsb.Altitude.toFixed(0)).toLocaleString() + ' m';
			// }
			// else {
			// 	alt = Number(_adsb.Altitude.toFixed(0) * js_helpers.CONST_METER_TO_FEET).toFixed(0).toLocaleString() + ' ft';
			// }

			// markerContent += '<p>lat:' + _adsb.Latitude.toFixed(6) + ', lng:' + _adsb.Longitude.toFixed(6) + '<br>  alt:' + alt + ' </p>';


			// if (infowindowADSB !== null && infowindowADSB !== undefined) infowindowADSB.close();


			// elevator.getElevationForLocations({
			// 	'locations': [event.latLng]
			// }, function (results, status) {


			// 	infowindowADSB = new google.maps.InfoWindow(
			// 		{
			// 		});


			// 	infowindowADSB.setContent(markerContent);
			// 	infowindowADSB.setPosition(event.latLng);
			// 	infowindowADSB.open(map);
			// });


		}


		function fn_showAndruavUnitInfo(p_lat, p_lng, p_andruavUnit) {
			var sys_id = "";
			if (p_andruavUnit.m_FCBParameters.m_systemID!=0)
			{
				sys_id='sysid:' + p_andruavUnit.m_FCBParameters.m_systemID + ' ';
			}
			var armedBadge = "";
			if (p_andruavUnit.m_isArmed) armedBadge = '<span class="text-danger">&nbsp;<strong>ARMED</strong>&nbsp;</span>';
			else armedBadge = '<span class="text-success">&nbsp;disarmed&nbsp;</span>';
			if (p_andruavUnit.m_isFlying) armedBadge += '<span class="text-danger">&nbsp;flying&nbsp;</span>';
			else armedBadge += '<span class="text-success">&nbsp;on-ground&nbsp;</span>';

			var markerContent = "<p class='img-rounded bg-primary text-white'><strong class='css_padding_5'>" + p_andruavUnit.m_unitName + "</strong> <span>" + sys_id + "</span></p>\
			  	<style class='img-rounded help-block'>" + p_andruavUnit.Description + "</style>";

			if (p_andruavUnit.m_IsGCS === false) {
				markerContent += "<span>" + armedBadge + " <span class='text-success'><strong>" + hlp_getFlightMode(p_andruavUnit) + "</strong></span> </span>";
			}
			else {
				markerContent += "<p> <span class='text-success'>Ground Control Station</span> </p>";
			}

			var vAlt = p_andruavUnit.m_Nav_Info.p_Location.alt;
			var vAlt_abs = p_andruavUnit.m_Nav_Info.p_Location.alt_abs;
			if (vAlt === undefined)
			{
				vAlt='?';
			}
			else
			{
				vAlt = vAlt.toFixed(0);
			}
			if (vAlt_abs == undefined)
			{
				vAlt_abs='';
			}
			else
			{
				vAlt_abs = ' <span class="text-primary">abs:</span>' + vAlt_abs.toFixed(0);
			}
			vAlt = vAlt + vAlt_abs;
			
			var vSpeed = p_andruavUnit.m_Nav_Info.p_Location.ground_speed;
			if (vSpeed === null || vSpeed === undefined)
			{
				vSpeed='?';
			}
			else
			{
				vSpeed = vSpeed.toFixed(1);
			}
			var vAirSpeed = p_andruavUnit.m_Nav_Info.p_Location.air_speed;
			if (vAirSpeed === null || vAirSpeed === undefined)
			{
				vAirSpeed='?';
			}
			else
			{
				vAirSpeed = vAirSpeed.toFixed(1);
			}
			js_leafletmap.fn_getElevationForLocation(p_lat, p_lng
				, function (p_elevation, p_lat, p_lng) {
				if (p_elevation !== null && p_elevation !== undefined) {

					if (js_localStorage.fn_getMetricSystem() === false) {
						p_elevation = js_helpers.CONST_METER_TO_FEET * p_elevation;
					}

					if (isNaN(p_elevation)===false)
					{
						p_elevation = p_elevation.toFixed(1);
					}
					markerContent += '<br><span class="text-primary">lat:' 
								+ '<span class="text-success">'+ (p_lat).toFixed(6) 
								+ '</span><span class="text-primary">,lng:' + '</span><span class="text-success">' + (p_lng).toFixed(6) 
								+ '</span><br><span class="text-primary ">alt:' + '</span><span class="text-success">' + vAlt + '</span><span class="text-primary"> m</span>'
								+ '<br><span class="text-primary ">GS:' + '</span><span class="text-success">' + vSpeed + ' </span><span class="text-primary"> m/s</span>'
								+ '<span class="text-primary "> AS:' + '</span><span class="text-success">' + vAirSpeed + ' </span><span class="text-primary"> m/s</span>';
					
					if (p_andruavUnit.m_Swarm.m_isLeader === true)
					{
						
						markerContent += '<br><span class="text-danger "><strong>Leader</strong></span>'
					}
					if (p_andruavUnit.m_Swarm.m_following !== null && p_andruavUnit.m_Swarm.m_following !== undefined)
					{
						var v_andruavUnitLeader = js_globals.m_andruavUnitList.fn_getUnit(p_andruavUnit.m_Swarm.m_following);
						if (v_andruavUnitLeader!=null)
						{
							markerContent += '<br><span class="text-warning ">Following:</span><span class="text-success ">'+ v_andruavUnitLeader.m_unitName +'</span>'
						}
					}
					
					if (js_globals.CONST_MAP_GOOLE === true)
					{
						markerContent += '<br> sea-lvl alt:' + p_elevation + ' m.</p>';
					} 
				}

				infowindow2 = js_leafletmap.fn_showInfoWindow (infowindow2,markerContent,p_lat,p_lng);
				
			});


		}

		function showAndruavHomePointInfo(p_lat, p_lng, p_andruavUnit) {
			var _style = "", _icon = "";


			var v_contentString = "<p class='img-rounded bg-primary text-white" + _style + "'><strong> Home of " + p_andruavUnit.m_unitName + _icon + "</strong></p><span class='help-block'><small>lat:" + parseFloat(p_andruavUnit.m_Geo_Tags.p_HomePoint.lat).toFixed(6) + ",lng:" + parseFloat(p_andruavUnit.m_Geo_Tags.p_HomePoint.lng).toFixed(6) + "</small></span>";

			infowindow = js_leafletmap.fn_showInfoWindow(infowindow, v_contentString, p_lat, p_lng);
		}

		function fn_showWaypointInfo(p_lat, p_lng, p_wayPointStep, p_andruavUnit) {

			var v_style = " css_margin_5px ", v_icon = "";

			var contentString = null;

			var v_footerMenu = "<div class='row'>";
			v_footerMenu += "<div class= 'col-sm-12'><p class='bg-success si-07x'>" + p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT + "</p></div>";
			v_footerMenu += "<div class= 'col-sm-6'><p class='cursor_hand text-primary si-07x' onclick=\"fn_doStartMissionFrom('" + p_andruavUnit.partyID + "'," + p_wayPointStep.m_Sequence + " )\">Start Here</p></div>";
			v_footerMenu += "";

			var v_contentString = "";
			switch (p_wayPointStep.waypointType) {
				case js_andruavMessages.CONST_WayPoint_TYPE_CIRCLE:
					v_contentString = "<p class='img-rounded " + v_style + "'><strong> Circle Seq#" + p_wayPointStep.m_Sequence + v_icon + "</strong></p><span class='help-block'>" + p_wayPointStep.Latitude + "," + p_wayPointStep.Longitude + "</span>";
					v_contentString += "<p class='text-primary'>radius: " + parseInt(p_wayPointStep.m_Radius).toFixed(1) + " m x" + parseInt(p_wayPointStep.m_Turns).toFixed(0) + "</p>";
					v_contentString += v_footerMenu;

					break;
				default:
					v_contentString = "<p class='img-rounded " + v_style + "'><strong> Waypoint Seq#" + p_wayPointStep.m_Sequence + v_icon + "</strong></p><span class='help-block'>" + p_wayPointStep.Latitude + "," + p_wayPointStep.Longitude + "</span>";
					v_contentString += v_footerMenu;
					break;
			}

			infowindow = js_leafletmap.fn_showInfoWindow (infowindow, v_contentString, p_lat, p_lng);
		}

		function showGeoFenceInfo(p_lat, p_lng, geoFenceInfo) {
			var _style, _icon;
			if (geoFenceInfo.m_shouldKeepOutside === true) {
				_style = "bg-danger";
				_icon = "&nbsp;<span class='glyphicon glyphicon-ban-circle text-danger css_float_right'></span>";
			}
			else {
				_style = "bg-success";
				_icon = "&nbsp;<span class='glyphicon glyphicon-ok-circle text-success css_float_right'></span>";
			}

			var v_contentString = "<p class='img-rounded " + _style + "'><strong>" + geoFenceInfo.m_geoFenceName + _icon + "</strong></p><span class='help-block'>" + p_lat.toFixed(7) + " " + p_lng.toFixed(7) + "</span>";
			v_contentString += "<div class='row'><div class= 'col-sm-12'><p class='cursor_hand bg-success link-white si-07x' onclick=\"window.open('./mapeditor.html?zoom=" + js_leafletmap.fn_getZoom() + "&lat=" + p_lat + "&lng=" + p_lng + "', '_blank')\"," + js_globals.CONST_DEFAULT_ALTITUDE + "," + js_globals.CONST_DEFAULT_RADIUS + "," + 10 + " )\">Open Geo Fence Here</p></div></div>";
			
			infowindow = js_leafletmap.fn_showInfoWindow (infowindow, v_contentString, p_lat, p_lng);

		}


		function EVT_andruavUnitGeoFenceBeforeDelete(me, geoFenceInfo) {
			if (geoFenceInfo !== null && geoFenceInfo !== undefined) {
				if (geoFenceInfo.flightPath !== null) {
					js_leafletmap.fn_hideItem(geoFenceInfo.flightPath);
				}
			}
			else {
				// hide all

				var keys = Object.keys(js_globals.v_andruavClient.andruavGeoFences);
				var size = Object.keys(js_globals.v_andruavClient.andruavGeoFences).length;

				for (var i = 0; i < size; ++i) {
					geoFenceInfo = js_globals.v_andruavClient.andruavGeoFences[keys[i]];

					if (geoFenceInfo.flightPath !== null && geoFenceInfo.flightPath !== undefined) {
						js_leafletmap.fn_hideItem(geoFenceInfo.flightPath);
					}

				}
			}
		}



		function EVT_andruavUnitGeoFenceUpdated(me, data) {
			const geoFenceInfo = data.fence;
			const p_andruavUnit = data.unit;

			var geoFenceCoordinates = geoFenceInfo.LngLatPoints;

			if (js_leafletmap.m_isMapInit === false) { // in case map is not loaded
				setTimeout(function () {
					EVT_andruavUnitGeoFenceUpdated(me, data);

				}, 800);
			}
			var v_geoFence = null;

			switch (geoFenceInfo.fencetype) {
				case js_andruavMessages.CONST_TYPE_LinearFence:
					v_geoFence = js_leafletmap.fn_drawPolyline(geoFenceCoordinates, geoFenceInfo.m_shouldKeepOutside);
					geoFenceInfo.flightPath = v_geoFence;
					
					if ( js_globals.v_andruavClient.andruavGeoFences.hasOwnProperty(geoFenceInfo.m_geoFenceName) === false) {
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo;
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units = {};
					}
					else {
						var oldgeoFenceInfo = js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName];
						if (oldgeoFenceInfo.flightPath !== null && oldgeoFenceInfo.flightPath !== undefined) {  // hide path from map
							js_leafletmap.fn_hideItem(geoFenceInfo.flightPath);
						}
						geoFenceInfo.Units = oldgeoFenceInfo.Units; // copy attached units
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo; // assume new fence is updated one.
					}

					break;

				case js_andruavMessages.CONST_TYPE_PolygonFence:

					v_geoFence = js_leafletmap.fn_drawPolygon(geoFenceCoordinates, geoFenceInfo.m_shouldKeepOutside);
					
					geoFenceInfo.flightPath = v_geoFence;
					

					if ( js_globals.v_andruavClient.andruavGeoFences.hasOwnProperty(geoFenceInfo.m_geoFenceName) === false) {
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo;
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units = {};
					}
					else {
						var oldgeoFenceInfo = js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName];
						if (oldgeoFenceInfo.flightPath !== null && oldgeoFenceInfo.flightPath !== undefined) {  // hide path from map
							js_leafletmap.fn_hideItem(geoFenceInfo.flightPath);
						}
						geoFenceInfo.Units = oldgeoFenceInfo.Units; // copy attached units
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo; // assume new fence is updated one.
					}

					break;

				case js_andruavMessages.CONST_TYPE_CylinderFence:

					v_geoFence = js_leafletmap.fn_drawCircle(geoFenceCoordinates[0], geoFenceInfo.m_maximumDistance, geoFenceInfo.m_shouldKeepOutside);
					
					geoFenceInfo.flightPath = v_geoFence;
					
					if ( js_globals.v_andruavClient.andruavGeoFences.hasOwnProperty(geoFenceInfo.m_geoFenceName) === false) {
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo;
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units = {};
					}
					else {
						var oldgeoFenceInfo = js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName];
						if (oldgeoFenceInfo.flightPath !== null && oldgeoFenceInfo.flightPath !== undefined) {  // hide path from map
							js_leafletmap.fn_hideItem(geoFenceInfo.flightPath);
						}
						geoFenceInfo.Units = oldgeoFenceInfo.Units; // copy attached units
						js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo; // assume new fence is updated one.
					}

					break;
			}

			if (v_geoFence !== null && v_geoFence !== undefined)
			{
				var _dblClickTimer;
				js_leafletmap.fn_addListenerOnDblClickMarker(v_geoFence, 
						function (p_lat, p_lng) {
							clearTimeout(_dblClickTimer);
  							_dblClickTimer = null;
							fn_contextMenu (js_leafletmap.fn_getLocationObjectBy_latlng(p_lat, p_lng));
						});
					
				js_leafletmap.fn_addListenerOnClickMarker (v_geoFence,
						function (p_lat, p_lng) {
							if (_dblClickTimer !== null && _dblClickTimer !== undefined) {
								return;
							  }
							  _dblClickTimer = setTimeout(() => {
							
								showGeoFenceInfo(p_lat, p_lng, geoFenceInfo);
							
								_dblClickTimer = null;
							  }, 200);

						});
			}
			if (p_andruavUnit !== null && p_andruavUnit !== undefined) 
			{
				// if p_andruavUnit is null then data is loaded from task stored DB system.
				js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units[p_andruavUnit.partyID] = {};
				js_globals.v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units[p_andruavUnit.partyID].geoFenceHitInfo =
					{
						hasValue: false,
						fenceName: geoFenceInfo.m_geoFenceName,
						m_inZone: false,
						m_shouldKeepOutside: geoFenceInfo.m_shouldKeepOutside
					}
			}


		}


		var EVT_andruavUnitGeoFenceHit = function (me, data) {
			const p_andruavUnit = data.unit;
			const geoFenceHitInfo = data.fenceHit;

			var fence = js_globals.v_andruavClient.andruavGeoFences[geoFenceHitInfo.fenceName];
			if ((fence === undefined) || (fence === null)) {
				js_globals.v_andruavClient.API_requestGeoFences(p_andruavUnit, geoFenceHitInfo.fenceName);
				return;
			}
			if (fence.Units[p_andruavUnit.partyID] === undefined) fence.Units[p_andruavUnit.partyID] = {};
			fence.Units[p_andruavUnit.partyID].geoFenceHitInfo = geoFenceHitInfo;
			if (p_andruavUnit.m_gui.m_marker === null || p_andruavUnit.m_gui.m_marker === undefined) return;   // will be updated later when GPS message is recieved from that drone.
			var typeMsg = "info"; var msg = "OK";
			if (geoFenceHitInfo.m_inZone && geoFenceHitInfo.m_shouldKeepOutside) { typeMsg = 'p_error'; msg = "should be Out fence " + geoFenceHitInfo.fenceName; }
			else if (!geoFenceHitInfo.m_inZone && !geoFenceHitInfo.m_shouldKeepOutside) { typeMsg = 'p_error'; msg = "should be In fence " + geoFenceHitInfo.fenceName; }
			// TODO: Replace Messenger REACT2
			// Messenger().post({
			// 	type: typeMsg,
			// 	message: p_andruavUnit.m_unitName + ":" + "GeoFenceHit: " + msg
			// });
			if (msg === "OK") {

			}
			else {
				js_speak.fn_speak("unit " + p_andruavUnit.m_unitName + " " + msg);
			}

			js_eventEmitter.fn_dispatch( js_globals.EE_unitUpdated, p_andruavUnit);
		}


		function gui_hidesubmenus() {
			$('div#debugpanel').hide();
			$('#btnConnectURL').hide();
		}

		function gui_init_yawCtrl() {
			//CTRL YAW	
			$('#modal_ctrl_yaw').hide();
			$('#modal_ctrl_yaw').draggable();
			$('#modal_ctrl_yaw').on("mouseover", function () {
				$('#modal_ctrl_yaw').css('opacity', '1.0');
			});
			$('#modal_ctrl_yaw').on("mouseout", function () {
				const opacity = $('#modal_ctrl_yaw').attr('opacity')
				if (opacity === null || opacity === undefined) {
					$('#modal_ctrl_yaw').css('opacity', '0.4');
				}
			});
			$('#modal_ctrl_yaw').find('#opaque_btn').on('click', function () {
				const opacity = $('#modal_ctrl_yaw').attr('opacity')
				if ( opacity === null || opacity === undefined) {
					$('#modal_ctrl_yaw').attr('opacity', '1.0');
					$('#modal_ctrl_yaw').css('opacity', '1.0');
				}
				else {
					$('#modal_ctrl_yaw').attr('opacity', null);
				}
			});
			$('#modal_ctrl_yaw').find('#btnGoto').on('click', function () {
				// assume what there is attribute partyID in the control used to pass parameter
				fn_gotoUnit_byPartyID($('#modal_ctrl_yaw').attr('partyID'));
			});
			$('#modal_ctrl_yaw').find('#btnclose').on('click', function () {
				$('#modal_ctrl_yaw').attr('opacity', null);
				$('#modal_ctrl_yaw').attr('partyID', null);
				$('#modal_ctrl_yaw').hide();
				$('#modal_ctrl_yaw').find('#btnYaw').unbind("click");
				$('#modal_ctrl_yaw').find('#btnResetYaw').unbind("click");
			});

			$('#modal_ctrl_yaw').find('#yaw_knob_out').on('click', function (e) {
				e.stopPropagation();
			});
			$('#modal_ctrl_yaw').find('#yaw_knob_out').mousemove(function (e) {
				e.stopPropagation();
			});
		}

		function fn_gui_init_unitList ()
		{
			$('#andruav_unit_list_array_float').draggable();
			$('#andruav_unit_list_array_float').on("mouseover", function () {
				$('#andruav_unit_list_array_float').css('opacity', '1.0');
			});
			$('#andruav_unit_list_array_float').on("mouseout", function () {
				$('#andruav_unit_list_array_float').css('opacity', '0.8');
			});
			
		}

		function fn_gui_init_fpvVtrl ()
		{
			$('#modal_fpv').hide();
			$('#modal_fpv').draggable();
			$('#modal_fpv').on('mouseover', function () {
				$('#modal_fpv').css('opacity', '1.0');
			});
			$('#modal_fpv').on('mouseout', function () {
				$('#modal_fpv').css('opacity', '0.4');
			});
			$('#modal_fpv').find('#btnclose').on('click', function () {
				$('#modal_fpv').hide();
			});
			//http://www.bootply.com/XyZeggFcK7

			$('#unitImg_save').click(hlp_saveImage_html);
			$('#modal_fpv').find('#btnGoto').click(hlp_gotoImage_Map);
		}



		export function fn_connect() {

			if ((js_andruavAuth.fn_logined() === true) && (js_globals.v_connectState !== true)) {
				js_andruavAuth.fn_do_logoutAccount($('#txtEmail').val(), $('#txtAccessCode').val());
				if ( js_globals.v_andruavClient !== null && js_globals.v_andruavClient !== undefined) {
					js_globals.v_andruavClient.API_delMe();
				}
				return;
			}
			else 
			{
				js_andruavAuth.fn_do_loginAccount($('#txtEmail').val(), $('#txtAccessCode').val());
			}

			if (js_andruavAuth.logined === false) {
				// TODO: Replace Messenger REACT2
				// Messenger().post({
				// 	type: 'p_error',
				// 	message: js_andruavAuth.m_errorMessage
				// });

				if (js_globals.v_connectState === true) {
					setTimeout(fn_connect, 4000);
				}

				return;
			}

			// create a group object
			if ( js_globals.v_andruavClient === null || js_globals.v_andruavClient === undefined) {

				if (js_andruavAuth.fn_logined() === false) return;
				js_globals.v_andruavClient = js_andruavclient2.AndruavClient;

				js_globals.v_andruavClient.partyID = ($('#txtUnitID').val()+$('#txtUnitID_ext').val()).replace('#','_');
				js_globals.v_andruavClient.unitID = $('#txtUnitID').val();
				js_globals.v_andruavClient.m_groupName = $('#txtGroupName').val();
				js_globals.v_andruavClient.fn_init();
				js_globals.v_andruavClient.m_server_ip = js_andruavAuth.m_server_ip;
				js_globals.v_andruavClient.m_server_port = js_andruavAuth.m_server_port;
				js_globals.v_andruavClient.m_server_port_ss = js_andruavAuth.m_server_port; // backward compatibility. SSL should be sent as a separate parameter
				js_globals.v_andruavClient.server_AuthKey = js_andruavAuth.server_AuthKey;
				js_globals.v_andruavClient._permissions_ = js_andruavAuth.fn_getPermission();
				js_eventEmitter.fn_subscribe(js_globals.EE_WS_OPEN,this,EVT_onOpen);
				js_eventEmitter.fn_subscribe(js_globals.EE_WS_CLOSE,this,EVT_onClose);
				js_eventEmitter.fn_subscribe(js_globals.EE_onSocketStatus2,this,fn_onSocketStatus);
				js_eventEmitter.fn_subscribe(js_globals.EE_onDeleted,this,EVT_onDeleted);
				js_eventEmitter.fn_subscribe(js_globals.EE_msgFromUnit_GPS,this,EVT_msgFromUnit_GPS);
				js_eventEmitter.fn_subscribe(js_globals.EE_msgFromUnit_IMG,this,EVT_msgFromUnit_IMG);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitAdded,this,EVT_andruavUnitAdded);
				js_eventEmitter.fn_subscribe(js_globals.EE_HomePointChanged,this,EVT_HomePointChanged);
				js_eventEmitter.fn_subscribe(js_globals.EE_DistinationPointChanged,this,EVT_DistinationPointChanged);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitError,this,EVT_andruavUnitError);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitGeoFenceUpdated,this,EVT_andruavUnitGeoFenceUpdated);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitGeoFenceHit,this,EVT_andruavUnitGeoFenceHit);
				js_eventEmitter.fn_subscribe(js_globals.EE_msgFromUnit_WayPoints,this,EVT_msgFromUnit_WayPoints);
				js_eventEmitter.fn_subscribe(js_globals.EE_msgFromUnit_WayPointsUpdated,this,EVT_msgFromUnit_WayPointsUpdated);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitArmedUpdated,this,EVT_andruavUnitArmedUpdated);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitGeoFenceBeforeDelete,this,EVT_andruavUnitGeoFenceBeforeDelete);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitFCBUpdated,this,EVT_andruavUnitFCBUpdated);
				
				
				
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitFlyingUpdated,this,EVT_andruavUnitFlyingUpdated);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitFightModeUpdated,this,EVT_andruavUnitFightModeUpdated);
				js_eventEmitter.fn_subscribe(js_globals.EE_andruavUnitVehicleTypeUpdated,this,EVT_andruavUnitVehicleTypeUpdated);
				
				
				
				
				
				js_globals.fn_console_log(js_andruavclient2.c_SOCKET_STATUS);

				js_globals.v_andruavClient.fn_connect(js_andruavAuth.fn_getSessionID());
			}
			else {
				js_globals.v_andruavClient.API_delMe();

			}


		};


		function fn_deleteShapesinDB()
		{
			js_globals.v_andruavClient.API_disableGeoFenceTasks(js_andruavAuth.m_username,js_globals.v_andruavClient.m_groupName,null,'_drone_',1);
			
			js_globals.v_andruavClient.API_requestDeleteGeoFences(null,null); // deattach drones from all fences in the group
			setTimeout (function ()
				{
					// because it can take time to update database so an early relead in vehicle will be false.
					js_globals.v_andruavClient.API_requestReloadLocalGroupGeoFenceTasks (null);
				}, 3000);
		}
	
	

		function fn_submitShapes () 
		{
			const len = js_globals.v_map_shapes.length;

			for (let i=0; i< len; ++i)
			{
				if (
				((js_globals.v_map_shapes[i].m_geofenceInfo.m_valid !== true)
				&& (js_globals.v_map_shapes[i].m_geofenceInfo.m_deleted !== true))
				)
	 			{
					fn_do_modal_confirmation('Missing Information','Please enter missing fence data.');
					js_globals.v_map_shapes[i].setStyle({
							color: '#FE8030'
						});
	 					return ;  // shape is not configured
				}
			}

			js_globals.v_andruavClient.API_requestDeleteGeoFences(null,null); // deattach drones from all fences in the group
			js_globals.v_andruavClient.API_disableGeoFenceTasks(js_andruavAuth.m_username,js_globals.v_andruavClient.m_groupName,null,'_drone_',1);

			// new instance
			const fence_plan = new js_mapmission.Clss_AndruavFencePlan(1);

			const res = fence_plan.fn_generateAndruavFenceData(js_globals.v_map_shapes);
			const len_res = res.length;
			for (let i=0; i< len_res; ++i)
			{
				if ((js_globals.v_andruavClient !== null) && (js_globals.v_andruavClient.fn_isRegistered()===true))
				{
					js_globals.v_andruavClient.API_saveGeoFenceTasks(js_andruavAuth.m_username,js_globals.v_andruavClient.m_groupName,null,'_drone_',1,res[i]);
				}
			}


			setTimeout (function ()
			{
				js_globals.v_andruavClient.API_requestReloadLocalGroupGeoFenceTasks (null);
			}, 3000);
		}

		function fn_missionTab()
		{
			$('#fenceControl_section').hide();
			$('#fence_global_section').hide();
			$('#c_missioncontrol_section').show();

			$('#btn_geofences').removeClass ('btn-success');
			$('#btn_geofences').addClass ('btn-secondary');

			$('#btn_missions').removeClass ('btn-secondary');
			$('#btn_missions').addClass ('btn-success');

			js_leafletmap.fn_enableDrawLine(false);
			js_leafletmap.fn_enableDrawCircle(false);
			js_leafletmap.fn_enableDrawPolygon(false);
			js_leafletmap.fn_enableDrawRectangle(false);

		}

		function fn_geoFenceTab()
		{
			$('#c_missioncontrol_section').hide();
			$('#fenceControl_section').show();
			$('#fence_global_section').show();

			$('#btn_missions').removeClass ('btn-success');
			$('#btn_missions').addClass ('btn-secondary');
			
			$('#btn_geofences').removeClass ('btn-secondary');
			$('#btn_geofences').addClass ('btn-success');

			js_leafletmap.fn_enableDrawMarker(false);
			js_leafletmap.fn_enableDrawLine(true);
			js_leafletmap.fn_enableDrawCircle(true);
			js_leafletmap.fn_enableDrawPolygon(true);
			js_leafletmap.fn_enableDrawRectangle(true);
		}

		

		export function fn_on_ready() {
			
			$(function () {
						 $('head').append('<link href="./images/de/favicon.ico" rel="shortcut icon" type="image/x-icon" />');
						 $(document).prop('title', js_siteConfig.CONST_TITLE);
				});

			if ((typeof(js_globals.CONST_MAP_GOOLE) == "undefined") || (js_globals.CONST_MAP_GOOLE === true))
			{
				var v_script = window.document.createElement('script');
				v_script.type='text/javascript';
				
				v_script.src="2a4034903490310033a90d2408a108a12e6924c1310033a9084429713021302129712d9027d924c131002b1133a90844264930212e6908a12e6924c1310033a908a124c131002b1108a12be433a90f812cb927d939310e89108114d13a2424c11ae93931118929710c40110414401a441ef11e4010811189302126491e402be40961384033a937510b642be4234127100af9264927d9297107e91ae91ef1129932c40bd1375105a4264924c12d902d90258424c126492cb90e892b112f442b113490172924c13100"._fn_hexDecode();
				window.document.body.append(v_script);
			}
			else
			if ((typeof(js_globals.CONST_MAP_GOOLE) !== "undefined") && (js_globals.CONST_MAP_GOOLE === false))
			{
				initMap();
			}

			if (js_globals.v_EnableADSB === true)
			{
				js_eventEmitter.fn_subscribe(js_globals.EE_adsbExchangeReady, this, fn_adsbObjectUpdate);
				js_eventEmitter.fn_subscribe(js_globals.EE_adsbExpiredUpdate, this, fn_adsbExpiredUpdate);
			}
			


			enableDragging();

			// Blink Map Link
			setInterval(function () { $('#webplugin_span').toggleClass('label-danger'); }, 2000);

			fn_showMap();
			
			if (js_globals.CONST_MAP_EDITOR !== true) 
            {
            	gui_hidesubmenus();
				gui_initGlobalSection();
			

			$('#btn_showMap').click(
				fn_showMap
			);

			$('#btn_showVideo').click(
				fn_showVideoMainTab
			);

			$('#btn_showControl').click(
				fn_showControl
			);


			$('#gimbaldiv').find('#btnpitchm').on('click', function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, -2, 0, 0);

			});

			$('#gimbaldiv').find('#btnrollp').on('click', function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, 0, +2, 0);

			});

			$('#gimbaldiv').find('#btnrollm').on('click', function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, 0, -2, 0);

			});

			$('#gimbaldiv').find('#btnyawp').on('click', function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, 0, 0, +2);

			});

			$('#gimbaldiv').find('#btnyawm').on('click', function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, 0, 0, -2);
			});

			gui_init_yawCtrl();
			fn_gui_init_fpvVtrl();
			fn_gui_init_unitList();
			}
			else
			{
				$('#btn_missions').click(
					fn_missionTab
				);
		
				$('#btn_geofences').click(
					fn_geoFenceTab
				);
			}
			
			if ((QueryString.test !== undefined) && (QueryString.test !== null)) {
				$('.subblock#command').show();
				$('div#debugpanel').show();
			}

			// LOGIN		
			if ((QueryString.email === null || QueryString.email === undefined) || (QueryString.accesscode === null || QueryString.accesscode === undefined)) {
				// window.location.href = "http://example.com";
				$('#txtUnitID').val('GCSMAP_' + js_helpers.fn_generateRandomString(3));

			}
			else {
				//http://127.0.0.1:9980/globalarclight.html?accesscode=myown&email=myown@myown.com&m_groupName=1&m_unitName=GCSWeb1

			}
			// if (js_globals.CONST_MAP_EDITOR !== true) 
            // {
			// 	window.AndruavLibs.LocalTelemetry.fn_onPacketReceived = EVT_GCSDataReceived;
			// 	window.AndruavLibs.LocalTelemetry.fn_onWebSocketOpened = EVT_GCSDataOpen;
			// }
			
			$("#alert .close").on('click', function (e) {
				$("#alert").hide();
			});

			$("#alert").hide();

			fn_handleKeyBoard();
			
			if (js_globals.CONST_MAP_EDITOR === true){
				fn_missionTab();
			}

			
		};  // end of onReady

		
		//$(document).ready(fn_on_ready);
