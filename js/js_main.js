var oldAppend = $.fn.append;
var v_map_shapes = [];

var v_vehicle_gui = {};

var planes_icon = [ './images/planetracker_r_0d_.png',
					'./images/planetracker_y_0d_.png',
					'./images/planetracker_g_0d_.png',
					'./images/planetracker_b_0d_.png'];
					

var quad_icon   = [ './images/drone_qq_1_0d.png',
					'./images/drone_qq_2_0d.png',
					'./images/drone_qq_3_0d.png',
					'./images/drone_qq_4_0d.png'];


var rover_icon  = [ './images/car1.png',
					'./images/car2.png',
					'./images/car3.png',
					'./images/car4.png'];


var boat_icon  = [ './images/boat1.png',
					'./images/boat2.png',
					'./images/boat3.png',
					'./images/boat4.png'];



var flightPath_colors = [
							'#75A4D3',
							'#75D3A4',
							'#A475D3',
							'#A4D375',
							'#D3A475',
							'#D375A4'
					];


var swarm_location_icon = [
				'./images/drone_q1_32x32.png',
				'./images/drone_q2_32x32.png',
				'./images/drone_q3_32x32.png',
				'./images/drone_q4_32x32.png',
				];


$.fn.append = function($el){
    var dom = ($el instanceof $) ? $el[0] : $el
    if(dom && dom.tagName=='SCRIPT'){
        this[0].appendChild(dom)
        return this
    }
    return oldAppend.apply(this,arguments)
}

var v_contextMenuOpen = false;


var isMapInit = false;
var myposition = null;
var elevator;
var m_markGuided = null;

var QueryString = function () {
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

			if (opt.handle === "") {
				var $el = this;
			} else {
				var $el = this.find(opt.handle);
			}

			return $el.css('cursor', opt.cursor).on("mousedown", function (e) {
				if (opt.handle === "") {
					var $drag = $(this).addClass('draggable');
				} else {
					var $drag = $(this).addClass('active-handle').parent().addClass('draggable');
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
	})(jQuery);


	$("[data-toggle=tooltip]").tooltip();
	$("[data-toggle=tooltip]").drags();
}
        

function fn_handleKeyBoard() {

	$('body').keydown(function (p_event) {

	if (p_event.key == null) return ;
				
	if (p_event.type === "keydown")
	{
		if (p_event.altKey === true) {

		}

		if (p_event.key.toLowerCase() == 'm') {
			fn_showMap();
		}
		
		if (p_event.key.toLowerCase() == 'r') {
			fn_showVideoMainTab();
		}
	}
	});

}
        

        //var video_out = window.document.getElementById("vid-box");
		var recordRTC;


		function fn_do_modal_confirmation(p_title, p_message, p_callback, p_yesCaption, p_style, p_noCaption) {
			if (p_style == null) {
				p_style = "bg-success";
			}
			p_style += " p-1 rounded_10px ";
			var callback = p_callback;
			$('#modal_saveConfirmation').children().find('h4#title').html(p_title);
			//$('#modal_saveConfirmation').children().find('h4#title').removeClass();
			$('#modal_saveConfirmation').children().find('h4#title').addClass("modal-title " + p_style);
			$('#modal_saveConfirmation').children().find('div.modal-body').html(p_message);
			//$('#modal_saveConfirmation').children().find('button#modal_btn_confirm').off('click');
			$('#modal_saveConfirmation').children().find('button#modal_btn_confirm').unbind('click');
			$('#modal_saveConfirmation').children().find('button#modal_btn_confirm').click(function () 
			{
				callback(true);
				$('#modal_saveConfirmation').modal('hide');
			});
			$('#modal_saveConfirmation').children().find('button#btnCancel').unbind('click');
			$('#modal_saveConfirmation').children().find('button#btnCancel').click(function () 
			{
				callback(false);
				$('#modal_saveConfirmation').modal('hide');
			});
			if (p_yesCaption == null)
			{
				p_yesCaption = "Yes";
			} 
			if (p_noCaption == null)
			{
				p_noCaption = "Cancel"
			}

			$('#modal_saveConfirmation').children().find('button#modal_btn_confirm').html(p_yesCaption);
			$('#modal_saveConfirmation').children().find('button#btnCancel').html(p_noCaption);
			
			$('#modal_saveConfirmation').modal('show');
		}



		function fn_takeLocalImage(p_andruavUnit, videoTrackID, id) {
			var v_talk = p_andruavUnit.m_Video.m_videoactiveTracks[videoTrackID];
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
			fn_saveData(dataURI, 'image/png');
		}


		function fn_startrecord(v_andruavUnit, v_videoTrackID) {
			var bitsPerSecond = 256 * 786 * 8;

			var options = {
				type: 'video',
				frameInterval: 30,
				dontFireOnDataAvailableEvent: true,
				canvas: { // this line works only in Chrome
					width: 1280,
					height: 720
				},
				video: { // this line works only in Chrome
					width: 1280,
					height: 720
				}
			};


			var v_talk = v_andruavUnit.m_Video.m_videoactiveTracks[v_videoTrackID];
			var mmRTC = v_talk.mmRTC = new MultiStreamRecorder([v_talk.stream], options);
			mmRTC.record();
			mmRTC.isStoppedRecording = false;

			v_talk.VideoRecording = true;
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_videoStreamRedraw, { 'andruavUnit': v_andruavUnit, 'v_track': v_videoTrackID });

		}




		function fn_doGimbalCtrlStep(unit, stepPitch, stepRoll, stepYaw) {
			v_andruavClient.API_do_GimbalCtrl(unit,
				stepPitch,
				stepRoll,
				stepYaw, false);
		}

		function fn_doGimbalCtrl(unit, pitch, roll, yaw) {
			v_andruavClient.API_do_GimbalCtrl(unit, pitch, roll, yaw, true);
		}


		function fn_showVideoMainTab() {
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

		function fn_applyControl(v_small_mode)
		{
			var v_display_mode = window.AndruavLibs.LocalStorage.fn_getDisplayMode();
		
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
					
					
				}
			}

			window.AndruavLibs.LocalStorage.fn_setDisplayMode(v_display_mode);
			window.AndruavLibs.AndruavMap.fn_invalidateSize();
		}

		function fn_showControl(v_small_mode) {
			window.AndruavLibs.LocalStorage.fn_setDisplayMode(parseInt(window.AndruavLibs.LocalStorage.fn_getDisplayMode())+1);
			fn_applyControl(v_small_mode);
		}

		


		function fn_showMap() {
			$('#div_video_control').hide();
			$('#div_map_view').show();
			$('#btn_showMap').hide();
			$('#btn_showVideo').show();
		}

		function fn_showSettings() {
			$('#andruavUnits_in').toggle();
			
			$([document.documentElement, document.body]).animate({
				scrollTop: $("#row_2").offset().top
			}, 100);
		}

		function onWEBRTCSessionStarted(c_talk) {
			var v_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(c_talk.number);
			v_andruavUnit.m_Video.m_videoactiveTracks[c_talk.targetVideoTrack] = c_talk;
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_videoStreamStarted, { 'andruavUnit': v_andruavUnit, 'talk': c_talk });
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, v_andruavUnit);
			//v_andruavClient.pub_streamOnOff = p;
		}

		function onWEBRTCSessionEnded(c_talk) {
			var v_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(c_talk.number);
			
			v_andruavUnit.m_Video.m_videoactiveTracks[c_talk.targetVideoTrack].VideoStreaming = CONST_VIDEOSTREAMING_OFF;
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_videoStreamStopped, { 'andruavUnit': v_andruavUnit, 'talk': c_talk });
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, v_andruavUnit);
		}


		function onWEBRTCSessionOrphanEnded(c_number) {
			var v_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(c_number);
			v_andruavUnit.m_Video.m_videoactiveTracks[c_number].VideoStreaming = CONST_VIDEOSTREAMING_OFF;
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, v_andruavUnit);
		}



		


		function fn_WEBRTC_login(v_partyID,v_trackID) {
		
			window.AndruavLibs.AndruavStream.onOrphanDisconnect = onWEBRTCSessionOrphanEnded;

			window.AndruavLibs.AndruavStream.joinStream(
				{

					number: v_partyID,
					targetVideoTrack: v_trackID,
					v_andruavClient: v_andruavClient,
					onDisplayVideo: onWEBRTCSessionStarted,
					onError: function (v_talk, v_errormsg) { v_SpeakEngine.fn_speak(v_errormsg); },
					onRemovestream: function () {
					},
					onDisconnected: onWEBRTCSessionEnded,

				}
			);
		}


		function fn_VIDEO_login(v_andruavVideo, v_trackId) {

			var len = v_andruavVideo.m_unit.m_Video.m_videoTracks.length;
			for (var i=0;i<len;++i)
			{
				if (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].id == v_trackId)
				{
					switch (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].p)
					{
						case CONST_EXTERNAL_CAMERA_TYPE_RTCWEBCAM:
							fn_WEBRTC_login(v_andruavVideo.m_unit.partyID,v_trackId);
						break;

						case CONST_EXTERNAL_CAMERA_TYPE_FFMPEGWEBCAM:
							fn_FFMPEG_login(v_andruavVideo,v_andruavVideo.m_unit.m_Video.m_videoTracks[i]);
						break;
					}
					break;
				}
			}
		}


		/*
			Video Recording
		*/
		function fn_VIDEO_Record(v_andruavVideo, v_trackId, p_Start) {

			if (v_andruavVideo == null) return ;

			var len = v_andruavVideo.m_unit.m_Video.m_videoTracks.length;
			for (var i=0;i<len;++i)
			{
				if (v_andruavVideo.m_unit.m_Video.m_videoTracks[i].id == v_trackId)
				{
					v_andruavClient.API_CONST_RemoteCommand_recordVideo (v_andruavVideo.m_unit.partyID, v_trackId, p_Start);
				}
			}
		}


        function fn_doYAW(p_andruavUnit, targetAngle, turnRate, isClockwise, isRelative) {
        	v_andruavClient.API_do_YAW(p_andruavUnit, targetAngle, turnRate, isClockwise, isRelative);
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
						break;
					case 1:
					case 2:
						return './images/blure/adrone_gr_32x32x45d.png';
						break;
					case 3:
					case 4:
						return './images/blure/adrone_gr_32x32x90d.png';
						break;
					case 5:
					case 6:
						return './images/blure/adrone_gr_32x32x135d.png';
						break;
					case 7:
					case 8:
						return './images/blure/adrone_gr_32x32x180d.png';
						break;
					case 9:
					case 10:
						return './images/blure/adrone_gr_32x32x225d.png';
						break;
					case 11:
					case 12:
						return './images/blure/adrone_gr_32x32x270d.png';
						break;
					case 13:
					case 14:
						return './images/blure/adrone_gr_32x32x315d.png';
						break;
					default: // NAN if Heading is null
						return './images/blure/adrone_gr_32x32.png';
						break;

				}
				return;
			}



			if ((_obj.Alt) < 500) {
				// if plane under drone by any difference, or heigher by 500 then alert
				switch (degIndex) {
					case 15:
					case 0:
						return './images/blure/adrone_br_32x32.png';
						break;
					case 1:
					case 2:
						return './images/blure/adrone_br_32x32x45d.png';
						break;
					case 3:
					case 4:
						return './images/blure/adrone_br_32x32x90d.png';
						break;
					case 5:
					case 6:
						return './images/blure/adrone_br_32x32x135d.png';
						break;
					case 7:
					case 8:
						return './images/blure/adrone_br_32x32x180d.png';
						break;
					case 9:
					case 10:
						return './images/blure/adrone_br_32x32x225d.png';
						break;
					case 11:
					case 12:
						return './images/blure/adrone_br_32x32x270d.png';
						break;
					case 13:
					case 14:
						return './images/blure/adrone_br_32x32x315d.png';
						break;
					default: // NAN if Heading is null
						return './images/blure/adrone_br_32x32.png';
						break;

				}
			}
			else {
				switch (degIndex) {
					case 15:
					case 0:
						return './images/blure/adrone_bk_32x32.png';
						break;
					case 1:
					case 2:
						return './images/blure/adrone_bk_32x32x45d.png';
						break;
					case 3:
					case 4:
						return './images/blure/adrone_bk_32x32x90d.png';
						break;
					case 5:
					case 6:
						return './images/blure/adrone_bk_32x32x135d.png';
						break;
					case 7:
					case 8:
						return './images/blure/adrone_bk_32x32x180d.png';
						break;
					case 9:
					case 10:
						return './images/blure/adrone_bk_32x32x225d.png';
						break;
					case 11:
					case 12:
						return './images/blure/adrone_bk_32x32x270d.png';
						break;
					case 13:
					case 14:
						return './images/blure/adrone_bk_32x32x315d.png';
						break;
					default: // NAN if Heading is null
						return './images/blure/adrone_bk_32x32.png';
						break;

				}
			}
		}

		function fn_handleADSBPopup(p_obj) {
			
		}

		function fn_adsbExpiredUpdate(me)
		{
			const ADSB_OBJECT_TIMEOUT = 13000;
			const count = window.AndruavLibs.ADSBObjectList.count;
			const now = new Date();
			const p_keys = Object.keys(window.AndruavLibs.ADSBObjectList.List);
		
			for (var i=0; i< count; ++i)
			{
				var adsb_obj  = window.AndruavLibs.ADSBObjectList.List[p_keys[i]];

				if ((now - adsb_obj.m_last_access) > ADSB_OBJECT_TIMEOUT)
				{
					if (adsb_obj.p_marker != null)
					{
						AndruavLibs.AndruavMap.fn_hideItem(adsb_obj.p_marker);
					}
				}
			}
		}

		function fn_adsbObjectUpdate(me, p_adsbObject)
		{
			var v_marker = p_adsbObject.p_marker;
			if (v_marker== null)
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
					
				v_marker = AndruavLibs.AndruavMap.fn_CreateMarker(icon, p_adsbObject.m_icao_address, null, false, false, v_htmladsb,[64,64]) ;
				p_adsbObject.p_marker = v_marker;
			}

			AndruavLibs.AndruavMap.fn_setPosition_bylatlng(p_adsbObject.p_marker, p_adsbObject.m_lat, p_adsbObject.m_lon, p_adsbObject.m_heading);
			AndruavLibs.AndruavMap.fn_showItem(p_adsbObject.p_marker);
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

		function gui_toggleUnits(dontflip) {

			// use current metric as other browser could change it and you will lose the SYNC
			// Scenario: if two browsers one is meter and the other is feet, the last one that switch
			// will record the value and ubunts in the storage. if you changed from other browser then 
			// the values and unit of the latest browser will overwrite the saved one... but if you refresh
			// the browser instead of changing the units the latter will take the values of the first one.
			window.AndruavLibs.LocalStorage.fn_setMetricSystem(v_useMetricSystem);
            
			if (window.AndruavLibs.LocalStorage.fn_getMetricSystem() == true) {
				if (dontflip != true) v_useMetricSystem = false;

				window.AndruavLibs.LocalStorage.fn_setMetricSystem(false);
				CONST_DEFAULT_ALTITUDE = (CONST_METER_TO_FEET * CONST_DEFAULT_ALTITUDE).toFixed(0);
				CONST_DEFAULT_RADIUS = (CONST_METER_TO_FEET * CONST_DEFAULT_RADIUS).toFixed(0);

				CONST_DEFAULT_ALTITUDE_min = CONST_DEFAULT_ALTITUDE_min * CONST_METER_TO_FEET;
				CONST_DEFAULT_RADIUS_min = CONST_DEFAULT_RADIUS_min * CONST_METER_TO_FEET;

			}
			else {
				if (dontflip != true) v_useMetricSystem = true;

				window.AndruavLibs.LocalStorage.fn_setMetricSystem(true);
				CONST_DEFAULT_ALTITUDE = (CONST_FEET_TO_METER * CONST_DEFAULT_ALTITUDE).toFixed(0);
				CONST_DEFAULT_RADIUS = (CONST_FEET_TO_METER * CONST_DEFAULT_RADIUS).toFixed(0);

				CONST_DEFAULT_ALTITUDE_min = CONST_DEFAULT_ALTITUDE_min * CONST_FEET_TO_METER;
				CONST_DEFAULT_RADIUS_min = CONST_DEFAULT_RADIUS_min * CONST_FEET_TO_METER;
			}
			fn_eval("2b1128a40400064037512b112f442710302137510844349030213100040004410e890e89040037512b112f44271030213751084433a927d92d9028a40691040037512b112f44271030213751084434903021310008442d903021264924c134902b1130212f44084432c427d931002d9024c1264927d9064037512b112f44271030213751084433a927d92d9028a408442d903021264924c134902b1130212f4408442a4032c427d928a406910d99"._fn_hexDecode());
			window.AndruavLibs.LocalStorage.fn_setDefaultAltitude(CONST_DEFAULT_ALTITUDE);
			window.AndruavLibs.LocalStorage.fn_setDefaultRadius(CONST_DEFAULT_RADIUS);
		};

		function fn_convertToMeter(value) {
			if (isNaN(value)) return 0;
			if (window.AndruavLibs.LocalStorage.fn_getMetricSystem() == true) {
				return value;
			}
			else {
				return value * CONST_FEET_TO_METER;
			}
		};

		function gui_initGlobalSection() {
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
			if ((QueryString.displaymode != null) || (isNumber(parseInt(QueryString.displaymode))))
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

				myposition = position;
				if (CONST_DISABLE_ADSG == false) {
					window.AndruavLibs.ADSB_Exchange.fn_changeDefaultLocation(
						myposition.coords.latitude,
						myposition.coords.longitude, 1000);
				}
				AndruavLibs.AndruavMap.fn_PanTo_latlng(
					myposition.coords.latitude,
					myposition.coords.longitude);

				AndruavLibs.AndruavMap.fn_setZoom (8);
			}

			if (QueryString.lat != null)
			{
				AndruavLibs.AndruavMap.fn_PanTo_latlng(
					QueryString.lat,
					QueryString.lng);

				AndruavLibs.AndruavMap.fn_setZoom (QueryString.zoom);

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


		var counter = 0;

		function fn_openFenceManager(p_partyID) {
			var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit == null) {
				return;
			}

			window.open('mapeditor.html?zoom=18&lat=' + p_andruavUnit.m_Nav_Info.p_Location.lat + '&lng=' + p_andruavUnit.m_Nav_Info.p_Location.lng);
			return false;
		}

		function fn_switchGPS(p_andruavUnit) {
			if (p_andruavUnit == null) {
				return;
			}

			v_andruavClient.API_setGPSSource(p_andruavUnit, (p_andruavUnit.m_GPS_Info1.gpsMode + 1) % 3)
		}

		

		function gui_camCtrl(p_partyID) {
			// var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p_partyID);
			// if (p_andruavUnit == null) {
			// 	return;
			// }

			// $('#modal_ctrl_cam').attr('partyID', p_partyID);
			// $('#modal_ctrl_cam').attr('data-original-title', 'Camera Control - ' + p_andruavUnit.m_unitName);
			// $('#modal_ctrl_cam').show();

		}

		function gui_doYAW(p_partyID) {
			var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit == null) {
				return;
			}

			var ctrl_yaw = $('#modal_ctrl_yaw').find('#btnYaw');
			ctrl_yaw.unbind("click");
			ctrl_yaw.click(function () {
				const target_angle_deg = $('#yaw_knob').val();
				const current_angle_deg = (CONST_RADIUS_TO_DEGREE * ((p_andruavUnit.m_Nav_Info.p_Orientation.yaw + CONST_PTx2) % CONST_PTx2)).toFixed(1);
				//let diff = angleDelta(target_angle_deg, current_angle_deg);
				let direction = isClockwiseAngle (current_angle_deg, target_angle_deg);
				fn_doYAW(p_andruavUnit, $('#yaw_knob').val(), 0, !direction, false);
			});

			var ctrl_yaw = $('#modal_ctrl_yaw').find('#btnResetYaw');
			ctrl_yaw.unbind("click");
			ctrl_yaw.click(function () {
				$('#yaw_knob').val(0);
				$('#yaw_knob').trigger('change');
				fn_doYAW(p_andruavUnit, -1, 0, true, false);
			});


			$('#yaw_knob').val((CONST_RADIUS_TO_DEGREE * ((p_andruavUnit.m_Nav_Info.p_Orientation.yaw + CONST_PTx2) % CONST_PTx2)).toFixed(1));
			$('#yaw_knob').trigger('change');
			$('#modal_ctrl_yaw').attr('data-original-title', 'YAW Control - ' + p_andruavUnit.m_unitName);
			$('#modal_ctrl_yaw').attr('partyID', p_partyID);
			$('#modal_ctrl_yaw').show(p_partyID);
		}


		function fn_doCircle(p_partyID) {
			v_andruavClient.API_do_FlightMode(p_partyID, CONST_FLIGHT_CONTROL_CIRCLE);
		}

		function fn_doCircle2(p_partyID, latitude, longitude, altitude, radius, turns) {

			var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit == null) return;
			if ((p_andruavUnit.m_VehicleType == VEHICLE_ROVER)
			|| (p_andruavUnit.m_VehicleType == VEHICLE_BOAT)) return;

			function fn_doCircle2_prv() {
				v_SpeakEngine.fn_speak('point recieved');
				v_andruavClient.API_do_CircleHere(p_partyID, latitude, longitude, altitude, radius, turns);
			}

			fn_doCircle2_prv(p_partyID);


		}


		function fn_doSetHome(p_partyID, p_latitude, p_longitude, p_altitude) {

			var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit != null) {
				fn_do_modal_confirmation("Set Home Location for  " + p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT, "Changing Home Location changes RTL destination. Are you Sure?", function (p_approved) {
					if (p_approved === false) return;
					v_SpeakEngine.fn_speak('home sent');
					v_andruavClient.API_do_SetHomeLocation(p_partyID, p_latitude, p_longitude, p_altitude);

				}, "YES");
			}
		}

		function fn_doFlyHere(p_partyID, p_latitude, p_longitude, altitude) {
			var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit != null) {
				v_SpeakEngine.fn_speak('point recieved');
				v_andruavClient.API_do_FlyHere(p_partyID, p_latitude, p_longitude, altitude);
			}
		}


		function fn_doStartMissionFrom(p_partyID, p_missionNumber) {
			var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit != null) {
				v_SpeakEngine.fn_speak(String(p_missionNumber) + ' is a start point');
				v_andruavClient.API_do_StartMissionFrom(p_andruavUnit, p_missionNumber );
			}
		}

		/**
		   Goto Unit on map
		**/
		function fn_gotoUnit_byPartyID(p_partyID) {
			var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p_partyID);
			if (p_andruavUnit == null) return;

			fn_gotoUnit(p_andruavUnit);
		}
		
		function fn_gotoUnit(p_andruavUnit) {
			if (p_andruavUnit == null) return;

			var marker = p_andruavUnit.m_gui.m_marker;
			if (marker != null) {
				AndruavLibs.AndruavMap.fn_PanTo(p_andruavUnit.m_gui.m_marker);
				// commented because zoom need to be after pan is completed otherwise map pans to wrong location.
				// if (AndruavLibs.AndruavMap.fn_getZoom() < 16) {
				// 	AndruavLibs.AndruavMap.fn_setZoom(17);
				// }
			}
		}

		function fn_helpPage (p_url)
		{
			window.open(p_url,'_blank');
		}

		function fn_changeUnitInfo (p_andruavUnit)
		{
			if (p_andruavUnit == null) return;
			
			$('#modal_changeUnitInfo').find('#title').html('Change Unit Name of ' + p_andruavUnit.m_unitName);
			$('#modal_changeUnitInfo').find('#txtUnitName').val(p_andruavUnit.m_unitName);
			$('#modal_changeUnitInfo').find('#txtDescription').val(p_andruavUnit.Description);
			$('#modal_changeUnitInfo').find('#btnOK').unbind("click");
			$('#modal_changeUnitInfo').find('#btnOK').click(function () {
				var v_unitName = $('#modal_changeUnitInfo').find('#txtUnitName').val();
				if (v_unitName == '') return;
				
				var v_unitDescription = $('#modal_changeUnitInfo').find('#txtDescription').val();
				if (v_unitDescription == '') return;
				
				v_andruavClient.API_setUnitName(p_andruavUnit, v_unitName, v_unitDescription);
			});
			$('#modal_changeUnitInfo').modal('show');
		}

		function fn_changeAltitude (p_andruavUnit) {

			if (p_andruavUnit == null) return;


			var v_altitude_val = p_andruavUnit.m_Nav_Info.p_Location.alt!=null?(p_andruavUnit.m_Nav_Info.p_Location.alt).toFixed(1):0;
			if (v_altitude_val< CONST_DEFAULT_ALTITUDE_min)
			{
				v_altitude_val = fn_convertToMeter(window.AndruavLibs.LocalStorage.fn_getDefaultAltitude()).toFixed(1) ;
			}

			var v_altitude_unit = 'm';

			if (v_useMetricSystem === false) {
				v_altitude_val = (v_altitude_val * CONST_METER_TO_FEET).toFixed(1);
				v_altitude_unit = 'ft';
			}
			

 
			$('#changespeed_modal').find('#title').html('Change Altitude of ' + p_andruavUnit.m_unitName);
			$('#changespeed_modal').find('#txtSpeed').val(v_altitude_val);
			$('#changespeed_modal').find('#txtSpeedUnit').html(v_altitude_unit);
			$('#changespeed_modal').find('#btnOK').unbind("click");
			$('#changespeed_modal').find('#btnOK').click(function () {
				var v_alt = $('#changespeed_modal').find('#txtSpeed').val();
				if (v_alt == '' || isNaN(v_alt)) return;
				if (v_useMetricSystem == false) {
					// the GUI in feet and FCB in meters
					v_alt = (parseFloat(v_alt) * CONST_FEET_TO_METER).toFixed(1);
				}
				// save target speed as indication.
				if (p_andruavUnit.m_VehicleType == VEHICLE_SUBMARINE)
				{
					v_andruavClient.API_do_ChangeAltitude(p_andruavUnit, -v_alt);
				}
				else
				{
					v_andruavClient.API_do_ChangeAltitude(p_andruavUnit, v_alt);
				}
			});
			$('#changespeed_modal').modal('show');
		}

		/**
		 Open Change Speed Modal 
		**/
		function fn_changeSpeed(p_andruavUnit, p_initSpeed) {
			if (p_andruavUnit == null) return;

			var v_speed_val = p_initSpeed;
			if (v_speed_val == null) 
			{
				if (p_andruavUnit.m_Nav_Info.p_Location.ground_speed!= null)
				{
					v_speed_val = parseFloat(p_andruavUnit.m_Nav_Info.p_Location.ground_speed);
				}
				else
				{
					v_speed_val = 0;
				}
			}
			
			var v_speed_unit;
			if (v_speed_val == null) {
				return;
			} else {
				
				
				if (v_useMetricSystem == true) {
					v_speed_val = v_speed_val.toFixed(1);
					v_speed_unit = 'm/s';
				}
				else {
					v_speed_val = (v_speed_val * CONST_METER_TO_MILE).toFixed(1);
					v_speed_unit = 'mph';
				}

			}
			
			$('#changespeed_modal').find('#title').html('Change Speed of ' + p_andruavUnit.m_unitName);
			$('#changespeed_modal').find('#btnOK').unbind("click");
			$('#changespeed_modal').find('#txtSpeed').val(v_speed_val);
			$('#changespeed_modal').find('#txtSpeedUnit').html(v_speed_unit);
			$('#changespeed_modal').find('#btnOK').click(function () {
				var v_speed = $('#changespeed_modal').find('#txtSpeed').val();
				if (v_speed == '' || isNaN(v_speed)) return;
				if (v_useMetricSystem == false) {
					// the GUI in miles and the FCB is meters
					v_speed = parseFloat(v_speed) * CONST_MILE_TO_METER;
				}
				// save target speed as indication.
				p_andruavUnit.m_Nav_Info.p_UserDesired.m_NavSpeed = v_speed;
				v_andruavClient.API_do_ChangeSpeed1(p_andruavUnit, parseFloat(v_speed));
			});
			$('#changespeed_modal').modal('show');

		}

		function fn_changeUDPPort(p_andruavUnit, init_pot) {
			if (p_andruavUnit == null) return;

			var v_port_val = init_pot;
			if (v_port_val == null) 
			{	
				v_port_val = p_andruavUnit.m_Telemetry.m_udpProxy_port;
			}
			
			v_unit = "";


			$('#changespeed_modal').find('#title').html('Change Speed of ' + p_andruavUnit.m_unitName);
			$('#changespeed_modal').find('#btnOK').unbind("click");
			$('#changespeed_modal').find('#txtSpeed').val(v_port_val);
			$('#changespeed_modal').find('#txtSpeedUnit').html(v_unit);
			$('#changespeed_modal').find('#btnOK').click(function () {
				var v_port_val = $('#changespeed_modal').find('#txtSpeed').val();
				if (v_port_val == '' || isNaN(v_port_val) || v_port_val >= 0xffff) return;
				v_andruavClient.API_setUdpProxyClientPort(p_andruavUnit, parseInt(v_port_val));
			});
			$('#changespeed_modal').modal('show');

		}

		/**
		   Switch Video OnOff
		*/
		function toggleVideo(p_andruavUnit) {
			if (p_andruavUnit == null) return;
			fn_retreiveCamerasList(p_andruavUnit);
		}


		function fn_retreiveCamerasList(p_andruavUnit) {
			if (p_andruavUnit == null) return;

				function fn_callback (p_session)
				{
					if ((p_session != null) && (p_session.status == 'connected')) 
					{
						if (p_session.m_unit.m_Video.m_videoTracks.length < 2) {
							fn_VIDEO_login(p_session, p_session.m_unit.m_Video.m_videoTracks[0].id);
							return;
						}
						else
						{
							window.AndruavLibs.EventEmitter.fn_dispatch (EE_displayStreamDlgForm, p_session);
						}
					}
				}
        
        		v_andruavClient.API_requestCameraList(p_andruavUnit, fn_callback);
		}


		/**
		   Switch Video OnOff
		*/
		function toggleRecrodingVideo(p_andruavUnit) {

			if (p_andruavUnit == null) return;

			function fn_callback (p_session)
        	{
				if ((p_session != null) && (p_session.status == 'connected')) {
					
					if (p_session.m_unit.m_Video.m_videoTracks.length < 2) {
						// backward compatibility ANdruav style.
						fn_VIDEO_Record(p_session, p_session.m_unit.m_Video.m_videoTracks[0].id, (p_session.m_unit.m_Video.m_videoTracks[0].r !=true));
						return;
					}
					else
					{
						window.AndruavLibs.EventEmitter.fn_dispatch (EE_displayStreamDlgForm, p_session);
					}
				}
        	}
        
        	v_andruavClient.API_requestCameraList(p_andruavUnit, fn_callback);
		}


		/**
		   return should be good & bad in the same time for different fences.
		*/
		function fn_isBadFencing(p_andruavUnit) {

			var keys = Object.keys(v_andruavClient.andruavGeoFences);
			var size = Object.keys(v_andruavClient.andruavGeoFences).length;

			/* 
				bit 0: out of green zone
				bit 1: in bad zone
				bit 2: in good zone
			*/
			var v_res = 0b00; // bit 1 is good & bit 0 is for bad
			for (var i = 0; i < size; ++i) {
				var fence = v_andruavClient.andruavGeoFences[keys[i]];

				if ((fence.Units != null) && (fence.Units.hasOwnProperty(p_andruavUnit.partyID))) {
					var geoFenceHitInfo = fence.Units[p_andruavUnit.partyID].geoFenceHitInfo;
					if (geoFenceHitInfo != null) {

						if (geoFenceHitInfo.hasValue == true) {
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

							if (geoFenceHitInfo.m_shouldKeepOutside == true) {
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
			if (p_andruavUnit.m_wayPoint == null) return;
			var markers = p_andruavUnit.m_gui.m_wayPoint_markers;
			if (markers == null) return;

			var count = markers.length;
			for (var i = 0; i < count; i++) {
				var marker = markers[i];
				AndruavLibs.AndruavMap.fn_hideItem (marker);
			}

			var polygons = p_andruavUnit.m_gui.m_wayPoint_polygons;
			if (polygons != null) {
				count = polygons.length;
				for (var i = 0; i < count; i++) {
					var polygon = polygons[i];
					AndruavLibs.AndruavMap.fn_hideItem(polygon);
				}
			}

			var polylines = p_andruavUnit.m_wayPoint.polylines;
			if (polylines != null) {
				AndruavLibs.AndruavMap.fn_hideItem(p_andruavUnit.m_wayPoint.polylines);
				//p_andruavUnit.m_wayPoint.polylines.setMap(null);
			}
		}
		function gui_setVisibleMarkersByVehicleType(vehicleType, visible) {
			var keys = v_andruavClient.m_andruavUnitList.fn_getUnitKeys();
			var size = keys.length;

			for (var i = 0; i < size; ++i) {

				var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(keys[i]);
				if (p_andruavUnit != null) {
					if (p_andruavUnit.m_VehicleType == vehicleType) {
						var marker = p_andruavUnit.m_gui.m_marker;
						if (marker != null) {
							marker.setVisible(visible);
						}
					}
				}
			}
		}


		function hlp_getFlightMode(p_andruavUnit) {
			//These are Andruav flight modes not Ardupilot flight modes. They are mapped in mavlink plugin
			var text = "undefined";
			if (p_andruavUnit.m_flightMode != null) {
				switch (p_andruavUnit.m_flightMode) {
					case CONST_FLIGHT_CONTROL_RTL:
						text = "RTL";
						break;
					case CONST_FLIGHT_CONTROL_SMART_RTL:
						text = "Smart RTL";
						break;
					case CONST_FLIGHT_CONTROL_FOLLOW_ME:
						text = "Follow Me";
						break;
					case CONST_FLIGHT_CONTROL_FOLLOW_UNITED:
						text = "Follow Me";
						break;
					case CONST_FLIGHT_CONTROL_AUTO:
						text = "Auto";
						break;
					case CONST_FLIGHT_CONTROL_STABILIZE:
						text = "Stabilize";
						break;
					case CONST_FLIGHT_CONTROL_ALT_HOLD:
						text = "Hold";
						break;
					case CONST_FLIGHT_CONTROL_MANUAL:
						text = "Manual";
						break;
					case CONST_FLIGHT_CONTROL_ACRO:
						text = "Acro";
						break;
					case CONST_FLIGHT_CONTROL_TAKEOFF:
						text = "Takeoff";
						break;
					case CONST_FLIGHT_CONTROL_GUIDED:
						text = "Guided";
						break;
					case CONST_FLIGHT_CONTROL_LOITER:
						text = "Loiter";
						break;
					case CONST_FLIGHT_CONTROL_POSTION_HOLD:
						text = "Pos-Hold";
						break;
					case CONST_FLIGHT_CONTROL_LAND:
						text = "Land";
						break;
					case CONST_FLIGHT_CONTROL_CIRCLE:
						text = "Circle";
						break;
					case CONST_FLIGHT_CONTROL_CRUISE:
						text = "Cruise";
						break;
					case CONST_FLIGHT_CONTROL_FBWA:
						text = "FBW A";
						break;
					case CONST_FLIGHT_CONTROL_FBWB:
						text = "FBW B";
						break;
					case CONST_FLIGHT_CONTROL_BRAKE:
						text = "Brake";
						break;
					case CONST_FLIGHT_CONTROL_HOLD:
						text = "Hold";
						break;
					case CONST_FLIGHT_CONTROL_SURFACE:
						text = "Surface";
						break;
					case CONST_FLIGHT_CONTROL_QHOVER:
						text = "QHover";
						break;
					case CONST_FLIGHT_CONTROL_QLOITER:
						text = "QLoiter";
						break;
					case CONST_FLIGHT_CONTROL_QSTABILIZE:
						text = "QStabilize";
						break;
					case CONST_FLIGHT_CONTROL_QLAND:
						text = "QLand";
						break;
					case CONST_FLIGHT_CONTROL_QRTL:
						text = "QRTL";
						break;
					case CONST_FLIGHT_CONTROL_INITIALIZE:
						text = "Initializing";
						break;
					case CONST_FLIGHT_MOTOR_DETECT:
						text = "Motor Detect";
						break;
					case CONST_FLIGHT_PX4_MANUAL:
						text = "Manual";
						break;
					case CONST_FLIGHT_PX4_ALT_HOLD:
						text = "Alt-Hold";
						break;
					case CONST_FLIGHT_PX4_AUTO_TAKEOFF:
						text = "Takeoff";
						break;
					case CONST_FLIGHT_PX4_AUTO_MISSION:
						text = "Mission";
						break;
					case CONST_FLIGHT_PX4_AUTO_HOLD:
						text = "Hold";
						break;
					case CONST_FLIGHT_PX4_AUTO_RTL:
						text = "RTL";
						break;
					case CONST_FLIGHT_PX4_AUTO_LAND:
						text = "Land";
						break;
					case CONST_FLIGHT_PX4_AUTO_FOLLOW_TARGET:
						text = "Follow";
						break;
					case CONST_FLIGHT_PX4_AUTO_PRECLAND:
						text = "Precland";
						break;
					case CONST_FLIGHT_PX4_VTOL_TAKEOFF:
						text = "VT-Takeoff";
						break;
					case CONST_FLIGHT_PX4_ACRO:
						text = "Acro";
						break;
					case CONST_FLIGHT_PX4_STABILIZE:
						text = "Stabilize";
						break;
					case CONST_FLIGHT_PX4_OFF_BOARD:
						text = "Off-Board";
						break;
					case CONST_FLIGHT_PX4_RATTITUDE:
						text = "R-ATT";
						break;
					case CONST_FLIGHT_PX4_POSCTL_POSCTL:
						text = "Pos-Ctrl";
						break;
					case CONST_FLIGHT_PX4_POSCTL_ORBIT:
						text = "Orbit";
						break;
					case CONST_FLIGHT_CONTROL_UNKNOWN:
					default:
						text = "Unknown";
						break;
					}
				}
			return text;
		}




		function hlp_generateFlyHereMenu(p_lat, p_lng) {

			if (v_andruavClient == null) {
				return "";
			}

			v_contextMenuOpen = true;

			var keys = v_andruavClient.m_andruavUnitList.fn_getUnitKeys();
			var size = keys.length;
			var v_contextHTML = "<div class='test-justified'>";
			var v_contextMenu = "";
			var v_menuitems = 0;
			v_contextHTML += "<p class='bg-success text-white'><span class='text-success margin_zero text-white'>lat: " + p_lat.toFixed(6) + "  lng:" + p_lng.toFixed(6) + "</span></p>";
			v_contextMenu += "<div class='row'><div class= 'col-sm-12'><p class='cursor_hand text-primary margin_zero si-07x' onclick=\"window.open('./mapeditor.html?zoom=" + AndruavLibs.AndruavMap.fn_getZoom() + "&lat=" + p_lat + "&lng=" + p_lng + "', '_blank')\"," + CONST_DEFAULT_ALTITUDE + "," + CONST_DEFAULT_RADIUS + "," + 10 + " )\">Open Geo Fence Here</p></div></div>";
			if (size == 0) {
				v_menuitems = 0;
			}
			else {
				for (var i = 0; i < size; ++i) {

					var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(keys[i]);
					if ((p_andruavUnit != null) && (p_andruavUnit.m_IsGCS != true)) {
						if ((p_andruavUnit.m_VehicleType == VEHICLE_ROVER)
						 || (p_andruavUnit.m_VehicleType == VEHICLE_BOAT)) {
							if ((p_andruavUnit.m_flightMode == CONST_FLIGHT_CONTROL_GUIDED) || (p_andruavUnit.m_flightMode == CONST_FLIGHT_CONTROL_AUTO) 
							|| (p_andruavUnit.m_flightMode == CONST_FLIGHT_PX4_AUTO_HOLD)) {
								v_contextMenu += "<div class='row'>";
								v_contextMenu += "<div class= 'col-sm-12'><p class='bg-primary text-white  si-07x'>" + p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT + "</p></div>";
								v_contextMenu += "<div class= 'col-6'><p class='cursor_hand margin_zero text-primary si-07x' onclick=\"fn_doFlyHere('" + p_andruavUnit.partyID + "'," + p_lat + "," + p_lng + "," + p_andruavUnit.m_Nav_Info.p_Location.alt + " )\">Goto Here</p></div>";
								v_contextMenu += "<div class= 'col-6'><p class='cursor_hand margin_zero text-primary si-07x' onclick=\"fn_doSetHome('" + p_andruavUnit.partyID + "'," + p_lat + "," + p_lng + "," + p_andruavUnit.m_Nav_Info.p_Location.alt_abs + " )\">Set Home</p></div>";
								
								v_contextMenu += "</div>";
								v_menuitems = v_menuitems + 1;
							}
						}
						else {
							if ((p_andruavUnit.m_flightMode == CONST_FLIGHT_CONTROL_GUIDED) || (p_andruavUnit.m_flightMode == CONST_FLIGHT_CONTROL_AUTO)
								|| (p_andruavUnit.m_flightMode == CONST_FLIGHT_PX4_AUTO_HOLD)) {
								v_contextMenu += "<div class='row css_txt_center'>";
								v_contextMenu += "<div class= 'col-sm-12'><p class='bg-primary text-white si-07x'>" + p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT + "</p></div>";
								v_contextMenu += "<div class= 'col-4 padding_zero'><p class='cursor_hand margin_zero text-primary si-07x' onclick=\"fn_doCircle2('" + p_andruavUnit.partyID + "'," + p_lat + "," + p_lng + "," + fn_convertToMeter(CONST_DEFAULT_ALTITUDE) + "," + fn_convertToMeter(CONST_DEFAULT_RADIUS) + "," + 10 + " )\">Circle</p></div>";
								v_contextMenu += "<div class= 'col-4 padding_zero'><p class='cursor_hand margin_zero text-primary si-07x' onclick=\"fn_doFlyHere('" + p_andruavUnit.partyID + "'," + p_lat + "," + p_lng + "," + p_andruavUnit.m_Nav_Info.p_Location.alt+ " )\">Goto Here</p></div>";
								v_contextMenu += "<div class= 'col-4 padding_zero'><p class='cursor_hand margin_zero text-primary si-07x' onclick=\"fn_doSetHome('" + p_andruavUnit.partyID + "'," + p_lat + "," + p_lng + "," + p_andruavUnit.m_Nav_Info.p_Location.alt_abs + " )\">Set Home</p></div>";
								v_contextMenu += "</div>";
								v_menuitems = v_menuitems + 1;
							}
						}
					}
				}
			}

			v_contextHTML += v_contextMenu;
			if (v_menuitems == 0) {

				v_contextHTML += "<div class='row'><div class= 'col-sm-12'><p class='text-warning '>No Guided Mode Vechiles</p></div></div>";

			}

			v_contextHTML += "</div>";
			return v_contextHTML;
		}




		function fn_generateContextMenuHTML(p_lat, p_lng)
		{
			$('.contextmenu').remove(); //remove previous context menus
			if (v_contextMenuOpen === true) 
			{
				v_contextMenuOpen = false;
				return ;
			}


			var contextmenuDir = document.createElement("div");
			contextmenuDir.className = 'contextmenu';
			//now add our options.
			var h =   hlp_generateFlyHereMenu(p_lat, p_lng); //event.latLng);

			AndruavLibs.AndruavMap.fn_showInfoWindow(null, h, p_lat, p_lng);
		}

		function fn_contextMenu(p_position) {
			// use JS Dom methods to create the menu
			// use event.pixel.x and event.pixel.y 
			// to position menu at mouse position

			if (this.m_markGuided != null) {
				AndruavLibs.AndruavMap.fn_hideItem(this.m_markGuided);
				this.m_markGuided = null;
			}
			
            m_markGuided = AndruavLibs.AndruavMap.fn_CreateMarker ('./images/waypoint_bg_32x32.png', 'target', [16,24], true, true);
            AndruavLibs.AndruavMap.fn_setPosition(this.m_markGuided , p_position);
			
			AndruavLibs.AndruavMap.fn_addListenerOnClickMarker (m_markGuided,
				
				function (p_lat, p_lng) {

					fn_generateContextMenuHTML(p_lat, p_lng);
				});

			//fn_generateContextMenuHTML(AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(p_lat, p_lng));
		}

		/////////////////////////////////////////////////////////////////////////////// MAP Functions
		var map = null;
		var infowindow = null;
		function initMap() {
			
			AndruavLibs.AndruavMap.fn_initMap('mapid');
			this.fn_setLapout();
			this.fn_gps_getLocation();

			// elevator = new google.maps.ElevationService;
			// fn_gps_getLocation(fn_gps_showPosition);

			// infowindow = new google.maps.InfoWindow({
			// 	size: new google.maps.Size(150, 50)
			// });

			// var update_timeout = null;
			// var dontexecute = false;
			// google.maps.event.addListener(map, 'click', function (event) {
			// 	update_timeout = setTimeout(function () {
			// 		//if (dontexecute) return ;
			// 		$('.contextmenu').remove();
			// 	}, 300);
			// });

			// google.maps.event.addListener(map, 'dblclick', function (event) {
			// 	clearTimeout(update_timeout);
			// 	dontexecute = true;
			// 	fn_contextMenu(event)
			// });


			// isMapInit = true;
		};


		function resetzoom() {
			AndruavLibs.AndruavMap.setZoom(2);
		}

		/////////////////////////////////////////////////////////////////////////////// Events from AndruavClient

		// Websocket Connection established
		var EVT_onOpen = function () {
			$('#andruavUnitGlobals').show();

			v_connectState = true;
			v_connectRetries = 0;
		}

		// Generic on Message Received
		var EVT_onMessage = function (evt) {
			counter += 1;
		}

		// called when sending any message
		var EVT_onSend = function (message) {
			counter += 1;
		}

		// called when Websocket Error	
		var EVT_onError = function (p_error) {
			counter += 1;
		}

		// called when Websocket Closed
		var EVT_onClose = function () {
			counter += 1;


			if (v_andruavClient != null) {
				v_andruavClient.fn_disconnect();
				v_andruavClient = null;
			}

			if (v_connectState == true) {

				v_connectRetries = v_connectRetries + 1;
				if (v_connectRetries >= 5) {
					v_SpeakEngine.fn_speak(CONST_Global_resources.en[8]);
				}
				setTimeout(fn_connect, 4000);
			}
			else {
				v_SpeakEngine.fn_speak('Disconnected');
			}
		};

		// Generic verbos log function
		var EVT_onLog = function (msg) {
			counter += 1;
			//$('#message_log').append("<div class='log_log_ctrl'>" + counter + "- Log:" + msg + "</div>");
		};

		function fn_onSocketStatus(status, name) {
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_onSocketStatus, { status: status, name: name });
			counter += 1;
			//$('#message_log').append("<div class=\"log_ctrl\">" + counter + "- Socket Status:" + name + "</div>");
			if (status == CONST_SOCKET_STATUS_REGISTERED) {
				v_SpeakEngine.fn_speak(CONST_Global_resources.en[7]);

				if (CONST_MAP_EDITOR===true)
				{
					v_andruavClient.API_loadGeoFence (window.AndruavLibs.AndruavAuth.m_username,v_andruavClient.m_groupName,null,'_drone_',1);
				}


			}
			else {

			}
		};


		function fn_putWayPoints(p_andruavUnit, p_eraseFirst) {

			var files = window.document.getElementById('btn_filesWP').files;
			if (p_andruavUnit == null) return ;

			if (!files.length) {
				alert('Please select a file!');
				return;
			}

			var file = files[0];

			var reader = new FileReader();

			// If we use onloadend, we need to check the readyState.
			reader.onloadend = function (evt) {
				if (evt.target.readyState == FileReader.DONE) { // DONE == 2
					v_andruavClient.API_uploadWayPoints(p_andruavUnit, p_eraseFirst, evt.target.result);
				}
			};

			if (v_andruavClient == null) return;

			reader.readAsBinaryString(file);
		}


		


		

		var EVT_GCSDataReceived = function (data) {
			if ((v_andruavClient == null) || (v_andruavClient.currentTelemetryUnit == null)) {
				return;
			}
			v_andruavClient.API_SendTelemetryData(v_andruavClient.currentTelemetryUnit, data);
		};

		var EVT_GCSDataOpen = function (data) {
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_onGUIMessageHide);
		};


		var EVT_BadMavlink = function () {
			//gui_alert('Web Telemetry', 'Please make sure that you use MAVLINK <b>version 2</b>.', 'danger');
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_onGUIMessage, {
				p_title:'Web Telemetry',
				p_msg:'Please make sure that you use MAVLINK <b>version 2</b>.',
				p_level:'danger'
			});

		};




		var EVT_onDeleted = function () {
			v_andruavClient.fn_disconnect();
			v_andruavClient = null;
		};



		var EVT_msgFromUnit_WayPointsUpdated = function (p_andruavUnit, missionIndexReached, status) {
			if (p_andruavUnit.m_wayPoint == null) {
				//no waypoint attached ... send asking for update
				v_andruavClient.API_requestWayPoints(p_andruavUnit);

				return;
			}

			if (p_andruavUnit.m_gui.m_wayPoint_markers != null) {
				const c_mission_index = missionIndexReached;
				var v_marker = p_andruavUnit.m_gui.m_wayPoint_markers[c_mission_index];
				if (v_marker != null) {
					v_marker.waypoint_status = status;
					if ((p_andruavUnit.m_wayPoint.wayPointPath[c_mission_index]==CONST_WayPoint_TYPE_CAMERA_TRIGGER)
					|| (p_andruavUnit.m_wayPoint.wayPointPath[c_mission_index]==CONST_WayPoint_TYPE_CAMERA_CONTROL)) {
						switch (status) {
							case CONST_Report_NAV_ItemReached:
								AndruavLibs.AndruavMap.fn_setMarkerIcon(v_marker, './images/camera_24x24.png', false, false, null, [16,16]);
								break;
							case CONST_Report_NAV_ItemUnknown:
								AndruavLibs.AndruavMap.fn_setMarkerIcon(v_marker, './images/camera_gy_32x32.png', false, false, null, [16,16]);
								break;
							case CONST_Report_NAV_ItemExecuting:
								AndruavLibs.AndruavMap.fn_setMarkerIcon(v_marker, './images/camera_bg_32x32.png', false, false, null, [16,16]);
								break;
						}
					}
					else {
						switch (status) {
							case CONST_Report_NAV_ItemReached:
								p_andruavUnit.m_Nav_Info._Target.wp_num = c_mission_index + 1;
								AndruavLibs.AndruavMap.fn_setMarkerIcon(v_marker, './images/location_gy_32x32.png');
								break;
							case CONST_Report_NAV_ItemUnknown:
								AndruavLibs.AndruavMap.fn_setMarkerIcon(v_marker, './images/location_bb_32x32.png');
								break;
							case CONST_Report_NAV_ItemExecuting:
								AndruavLibs.AndruavMap.fn_setMarkerIcon(v_marker, './images/location_bg_32x32.png');
								break;

						}
					}
				}
			}
		}

		var EVT_msgFromUnit_WayPoints = function (p_andruavUnit, wayPointArray) {
			// TODO HERE >>> DELETE OLD WAYPOINTS AND HIDE THEM FROM MAP
			var LngLatPoints = [];

			hlp_deleteOldWayPointOfDrone(p_andruavUnit);

			p_andruavUnit.m_wayPoint = {};
			p_andruavUnit.m_wayPoint.wayPointPath = wayPointArray;
			p_andruavUnit.m_gui.m_wayPoint_markers = [];
			p_andruavUnit.m_gui.m_wayPoint_polygons = [];

			if (wayPointArray.length == 0) return;
			var latlng = null;
			for (var i = 0; i < wayPointArray.length; ++i) {
				var subIcon = false;	
				var wayPointStep = wayPointArray[i];
				var icon_img = './images/location_bb_32x32.png';
				switch (wayPointStep.waypointType) {
					case CONST_WayPoint_TYPE_WAYPOINTSTEP:
						latlng = AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
						icon_img = './images/location_bb_32x32.png';
						wayPointStep.m_label = "WP";
						break;
					case CONST_WayPoint_TYPE_SPLINE:
						latlng = AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
						icon_img = './images/location_bb_32x32.png';
						wayPointStep.m_label = "Spline";
						break;
					case CONST_WayPoint_TYPE_EKLA3:
						//icon_img = './images/plane_b_32x32.png';
						wayPointStep.m_label = "Takeoff";
						break;
					case CONST_WayPoint_TYPE_HOBOOT:
						wayPointStep.m_label = "Land";
						break;
					case CONST_WayPoint_TYPE_RTL:
						wayPointStep.m_label = "RTL";
						break;
					case CONST_WayPoint_TYPE_CAMERA_TRIGGER:
						latlng = AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(latlng.lat+0.00001, latlng.lng+0.00001);
						icon_img = './images/camera_gy_32x32.png';
						subIcon = true;
						wayPointStep.m_label = "CAM";
						break;
					case CONST_WayPoint_TYPE_CAMERA_CONTROL:
						latlng = AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(latlng.lat+0.00001, latlng.lng+0.00001);
						icon_img = './images/camera_gy_32x32.png';
						subIcon = true;
						wayPointStep.m_label = "CAM";
						break;
					case CONST_WayPoint_TYPE_CIRCLE:
						latlng = AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(wayPointStep.Latitude, wayPointStep.Longitude);
						icon_img = './images/location_bb_32x32.png';
						wayPointStep.m_label = "Loiter in Circles";
						var v_circleMission = AndruavLibs.AndruavMap.fn_drawMissionCircle(latlng,wayPointStep.m_Radius);
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


				if (latlng != null) {
					var v_iconsize = [32,32];
					if (subIcon==true) {
						v_iconsize = [16,16];
					}
					var v_mark = AndruavLibs.AndruavMap.fn_CreateMarker(icon_img, p_andruavUnit.m_unitName + "  step: " + wayPointStep.m_Sequence, [16,24], false, false, null, v_iconsize);
					AndruavLibs.AndruavMap.fn_setPosition(v_mark, latlng);
					p_andruavUnit.m_gui.m_wayPoint_markers.push(v_mark);
					v_mark.wayPointStep = wayPointStep;

					
					function fn_clickHandler(w, u) {
						AndruavLibs.AndruavMap.fn_addListenerOnClickMarker (v_mark,
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
				p_andruavUnit.m_wayPoint.polylines = AndruavLibs.AndruavMap.fn_drawMissionPolyline(LngLatPoints, flightPath_colors[p_andruavUnit.m_index%4]);
			}
		}


		function EVT_msgFromUnit_NavInfo(p_andruavUnit) {
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitNavUpdated, p_andruavUnit);
		}

		
		function EVT_andruavUnitFCBUpdated(p_andruavUnit) {
			if (p_andruavUnit.m_useFCBIMU == true) {
				v_SpeakEngine.fn_speak(p_andruavUnit.m_unitName + ' connected to flying board');
				this.API_requestParamList(p_andruavUnit);
			}
			else {
				v_SpeakEngine.fn_speak(p_andruavUnit.m_unitName + ' disconnected from flying board');
			}
		}

		function EVT_andruavUnitFlyingUpdated(p_andruavUnit) {
			if (p_andruavUnit.m_isFlying == true) {
				v_SpeakEngine.fn_speak(p_andruavUnit.m_unitName + ' is Flying');
			}
			else {
				v_SpeakEngine.fn_speak(p_andruavUnit.m_unitName + ' is on ground');
			}
		}




		function EVT_andruavUnitFightModeUpdated(p_andruavUnit) {
			if (p_andruavUnit.m_IsGCS != true) {
				var text = hlp_getFlightMode(p_andruavUnit);
				v_SpeakEngine.fn_speak(p_andruavUnit.m_unitName + ' flight mode is ' + text);
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

		function EVT_andruavUnitVehicleTypeUpdated(p_andruavUnit) {
			const v_htmlTitle = "<p class='text-white margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
			AndruavLibs.AndruavMap.fn_setVehicleIcon(p_andruavUnit.m_gui.m_marker, getVehicleIcon(p_andruavUnit, (CONST_MAP_GOOLE === true)), p_andruavUnit.m_unitName,null, false,false, v_htmlTitle,[64,64]) ;
		}

		function EVT_andruavUnitModuleUpdated (p_andruavUnit) {
			//TODO: 
		}

		function EVT_andruavUnitArmedUpdated(p_andruavUnit) {
			if (p_andruavUnit.m_isArmed) {
				v_SpeakEngine.fn_speak('ARMED');
			}
			else {
				v_SpeakEngine.fn_speak('Disarmed');
			}

			window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, p_andruavUnit);
		}


		function getDestinationPointIcon (p_point_type, p_vehicle_index)
		{
			switch (p_point_type)
			{
				case CONST_DESTINATION_GUIDED_POINT:
				return './images/destination_bg_32x32.png';
				case CONST_DESTINATION_SWARM_MY_LOCATION:
				return swarm_location_icon[p_vehicle_index];
			}
		}

		function getPlanIcon(bearingIndex, vehicle_index) {
			return planes_icon[vehicle_index];
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

		function getVehicleIcon(p_andruavUnit, applyBearing) {


			if (p_andruavUnit.m_IsGCS == true) {
				return './images/map_gcs_3_32x32.png';
			}
			else {

				switch (p_andruavUnit.m_VehicleType) {
					case VEHICLE_TRI:
						p_andruavUnit.m_VehicleType_TXT = "Tricopter";
						return quad_icon[p_andruavUnit.m_index%4];
					case VEHICLE_QUAD:
						p_andruavUnit.m_VehicleType_TXT = "Quadcopter";
						return quad_icon[p_andruavUnit.m_index%4];
					case VEHICLE_PLANE:
						p_andruavUnit.m_VehicleType_TXT = "Fixed Wings";
						return planes_icon[p_andruavUnit.m_index%4];
					case VEHICLE_HELI:
						p_andruavUnit.m_VehicleType_TXT = "Heli";
						return './images/heli_1_32x32.png';
					case VEHICLE_ROVER:
						p_andruavUnit.m_VehicleType_TXT = "Rover";
						return rover_icon[p_andruavUnit.m_index%4];
					case VEHICLE_BOAT:
						p_andruavUnit.m_VehicleType_TXT = "Boat";
						return boat_icon[p_andruavUnit.m_index%4];
					case VEHICLE_SUBMARINE:
						p_andruavUnit.m_VehicleType_TXT = "Submarine";
						return './images/submarine_gb_32x32.png';
						
						default:
						return './images/drone_3_32x32.png';
				}
			}
		}

		/**
		   Called when message [CONST_TYPE_AndruavMessage_GPS] is received from a UNIT or GCS holding IMU Statistics
		 */
		function EVT_msgFromUnit_GPS(p_andruavUnit) {
			function getLabel() {
				return p_andruavUnit.m_unitName;
			}

			
			if ((p_andruavUnit.m_defined ===true) && (p_andruavUnit.m_Nav_Info.p_Location.lat != null)) {
				
				if (p_andruavUnit.m_gui.m_marker == null)
				{
					if (v_vehicle_gui[p_andruavUnit.partyID]!= null)
					{
						p_andruavUnit.m_gui = v_vehicle_gui[p_andruavUnit.partyID];
					}
				}
				
				var marker = p_andruavUnit.m_gui.m_marker;

				if (CONST_DISABLE_ADSG == false) {
					window.AndruavLibs.ADSB_Exchange.fn_getADSBDataForUnit(p_andruavUnit);
				}
				
				var v_image =  getVehicleIcon(p_andruavUnit, (CONST_MAP_GOOLE === true));

				if (marker == null) {
					// create a buffer for flight path
					p_andruavUnit.m_gui.m_gui_flightPath.fn_flush();
					p_andruavUnit.m_gui.m_flightPath_style = {
															color: flightPath_colors[p_andruavUnit.m_index%4],
															opacity: 0.8,
															weight: 5,
															dashArray: '5, 5'
															};


					/*
						v_htmlTitle: Valid only for Leaflet
					*/
					var v_htmlTitle = "<p class='text-white margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
					// Add new Vehicle
					p_andruavUnit.m_gui.m_marker = AndruavLibs.AndruavMap.fn_CreateMarker(v_image, getLabel(),null, false,false, v_htmlTitle,[64,64]) ;
					v_vehicle_gui[p_andruavUnit.partyID]  = p_andruavUnit.m_gui;
					
					AndruavLibs.AndruavMap.fn_addListenerOnClickMarker (p_andruavUnit.m_gui.m_marker,
						function (p_lat, p_lng) {
							fn_showAndruavUnitInfo(p_lat, p_lng, p_andruavUnit);
							infowindow2.m_ignoreMouseOut = true;
						});
					
					AndruavLibs.AndruavMap.fn_addListenerOnMouseOverMarker (p_andruavUnit.m_gui.m_marker,
						function (p_lat, p_lng) {
							AndruavLibs.AndruavMap.fn_addListenerOnMouseOutClickMarker (p_andruavUnit.m_gui.m_marker,
								function (p_lat, p_lng) {
									AndruavLibs.AndruavMap.fn_removeListenerOnMouseOutClickMarker(p_andruavUnit.m_gui.m_marker);
									if ((infowindow2==null) || (!infowindow2.hasOwnProperty('m_ignoreMouseOut')) || (infowindow2.m_ignoreMouseOut!==true))
									{
										AndruavLibs.AndruavMap.fn_hideInfoWindow(infowindow2);
									}
							});

							fn_showAndruavUnitInfo(p_lat, p_lng, p_andruavUnit);
						});
				}
				else {
					// DRAW path
					if (p_andruavUnit.m_Nav_Info.p_Location.oldlat != null) {
						var v_distance = fn_calcDistance(
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
							var v_flightPath = AndruavLibs.AndruavMap.fn_DrawPath(
										p_andruavUnit.m_Nav_Info.p_Location.oldlat,
										p_andruavUnit.m_Nav_Info.p_Location.oldlng,
										p_andruavUnit.m_Nav_Info.p_Location.lat,
										p_andruavUnit.m_Nav_Info.p_Location.lng,
										p_andruavUnit.m_gui.m_flightPath_style);

							// Add flight path step
							p_andruavUnit.m_gui.m_gui_flightPath.fn_add(v_flightPath, true,
								function (oldstep) {
									AndruavLibs.AndruavMap.fn_hideItem(oldstep);
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
				AndruavLibs.AndruavMap.fn_setIcon(p_andruavUnit.m_gui.m_marker, v_image);
				AndruavLibs.AndruavMap.fn_setPosition_bylatlng(p_andruavUnit.m_gui.m_marker, p_andruavUnit.m_Nav_Info.p_Location.lat, p_andruavUnit.m_Nav_Info.p_Location.lng, p_andruavUnit.m_Nav_Info.p_Orientation.yaw);
				window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, p_andruavUnit);
			}
			else {

			}
		}

		/**
		  Called when message [CONST_TYPE_AndruavMessage_IMUStatistics] is received from a UNIT or GCS holding IMU Statistics
		*/
		function EVT_msgFromUnit_IMUStatistics(p_andruavUnit, imuStatistics) {

		}


		/**
		 Called when message [CONST_TYPE_AndruavMessage_IMG] is received from a UNIT or GCS 
	   */
		function EVT_msgFromUnit_IMG(p_andruavUnit, bin, description, latitude, logitude, gpsProvider, time, altitude, speed, bearing, accuracy) {


			if (bin.length>0)
			{
				var blob = new Blob([bin], { type: 'image/jpeg' });


				var reader = new FileReader();
				reader.onload = function (event) {
					var contents = event.target.result;
					$('#unitImg').data('binaryImage', contents);
					//saveData (contents,'image.jpg');

					// Cleanup the reader object
					reader.abort();
                    reader = null;
					return;
				};

				reader.onerror = function (event) {
					console.p_error("File could not be read! Code " + event.target.p_error.code);
				};

				reader.readAsDataURL(blob);

				$('#unitImg').attr('src', 'data:image/jpeg;base64,' + fn_arrayBufferToBase64(bin));
				$('#modal_fpv').show();
			}

			var latlng = AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(latitude, logitude);
			$('#unitImg').data('imgLocation', latlng);
			fn_showCameraIcon(latlng);
		}

		function fn_showCameraIcon(latlng) {
			var v_marker = AndruavLibs.AndruavMap.fn_CreateMarker('./images/camera_24x24.png', 'image');
			AndruavLibs.AndruavMap.fn_setPosition(v_marker,latlng);
		}

		function hlp_saveImage_html() {
			var contents = $('#unitImg').data('binaryImage');
			saveData(contents, 'image.jpg');

		}


		function hlp_gotoImage_Map() {
			var location = $('#unitImg').data('imgLocation');
			if (location != null) {
				// if (AndruavLibs.AndruavMap.fn_getZoom() < 14) {
				// 	AndruavLibs.AndruavMap.fn_setZoom(14);
				// }

				AndruavLibs.AndruavMap.fn_PanTo(location);
			}
		}

		/**
		  Called when a video request is sent to a Unit
		*/
		function EVT_videoStateChanged(p_andruavUnit, OnOff) {

		}

		var EVT_msgFromUnit_VIDEO = function (p_andruavUnit, img) {
			$('video-rtc-div').hide();
			$('#video-rtc-div').html('');
			$('#unitVideo').show();
			var bin = img; //fn_Str2BinaryArray(img);
			$('#unitVideo').attr('src', 'data:image/jpeg;base64,' + fn_arrayBufferToBase64(bin));
		}

		

		/**
		  Called when a new unit joins the system.
		*/
		var EVT_andruavUnitAdded = function (p_andruavUnit) {
			if (p_andruavUnit.m_IsGCS == false) {
				p_andruavUnit.m_gui.m_mapObj = map;
				p_andruavUnit.m_gui.defaultHight = CONST_DEFAULT_ALTITUDE;
				p_andruavUnit.m_gui.defaultCircleRadius = CONST_DEFAULT_RADIUS;
			}
			//  hlp_createHTMLforUnit(p_andruavUnit);

			v_SpeakEngine.fn_speak(p_andruavUnit.m_unitName + " unit added");

			window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitAdded, p_andruavUnit);
			v_andruavClient.API_requestIMU (p_andruavUnit,true);
		}	


		var EVT_HomePointChanged = function (p_andruavUnit) {
			var v_latlng = AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(p_andruavUnit.m_Geo_Tags.p_HomePoint.lat, p_andruavUnit.m_Geo_Tags.p_HomePoint.lng);

			if (p_andruavUnit.m_gui.m_marker_home == null) {
				const v_html = "<p class='text-light margin_zero fs-6'>" + p_andruavUnit.m_unitName + "</p>";
				var v_home = AndruavLibs.AndruavMap.fn_CreateMarker('./images/home_b_24x24.png', p_andruavUnit.m_unitName, [16,24], false, false, v_html, [32,32]);
				AndruavLibs.AndruavMap.fn_setPosition(v_home,v_latlng)
				p_andruavUnit.m_gui.m_marker_home = v_home;
				
				AndruavLibs.AndruavMap.fn_addListenerOnClickMarker(v_home, 
					function (p_lat, p_lng) {
						update_timeout = setTimeout(function () {
						//if (dontexecute) return ;
						showAndruavHomePointInfo(p_lat, p_lng, p_andruavUnit);
					}, 300);
				});
			}

			AndruavLibs.AndruavMap.fn_setPosition(p_andruavUnit.m_gui.m_marker_home,v_latlng);

		};


		var EVT_DistinationPointChanged = function (p_andruavUnit) {

			if ((CONST_FEATURE.DISABLE_SWARM_DESTINATION_PONTS===true) && (p_andruavUnit.m_Geo_Tags.p_DestinationPoint.type == CONST_DESTINATION_SWARM_MY_LOCATION))
			{
				return ;
			}
			var v_latlng = AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(p_andruavUnit.m_Geo_Tags.p_DestinationPoint.lat, p_andruavUnit.m_Geo_Tags.p_DestinationPoint.lng);

			if (p_andruavUnit.m_gui.m_marker_destination == null) {
				p_andruavUnit.m_gui.m_marker_destination = AndruavLibs.AndruavMap.fn_CreateMarker('./images/destination_bg_32x32.png', "Target of: " + p_andruavUnit.m_unitName);
			}
			
			if (p_andruavUnit.m_Geo_Tags.p_DestinationPoint.m_needsIcon===true)
			{
				AndruavLibs.AndruavMap.fn_setMarkerIcon(p_andruavUnit.m_gui.m_marker_destination, getDestinationPointIcon(p_andruavUnit.m_Geo_Tags.p_DestinationPoint.type, p_andruavUnit.m_index%4));
				p_andruavUnit.m_Geo_Tags.p_DestinationPoint.m_needsIcon = false;
			}
			
				
			AndruavLibs.AndruavMap.fn_setPosition(p_andruavUnit.m_gui.m_marker_destination,v_latlng)
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
		var EVT_andruavUnitError = function (p_andruavUnit, p_error) {
			
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
			window.AndruavLibs.EventEmitter.fn_dispatch(EE_onMessage, c_msg);
		
			


			$('#message_notification').append("<div class='" + v_cssclass + "'>" + p_andruavUnit.m_unitName + ": " + p_error.Description + "</div>");

			if (p_error.infoType != CONST_INFOTYPE_GEOFENCE) {
				if (p_error.v_notification_Type <=3)
				{ 
					//http://github.hubspot.com/messenger/docs/welcome/
					Messenger().post({
						type: v_notification_Type,
						message: p_andruavUnit.m_unitName + ":" + p_error.Description
					});
					
					// only speak out errors
					v_SpeakEngine.fn_speak(p_andruavUnit.m_unitName + ' ' + p_error.Description);
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
			// if (v_useMetricSystem == true) {
			// 	alt = Number(_adsb.Altitude.toFixed(0)).toLocaleString() + ' m';
			// }
			// else {
			// 	alt = Number(_adsb.Altitude.toFixed(0) * CONST_METER_TO_FEET).toFixed(0).toLocaleString() + ' ft';
			// }

			// markerContent += '<p>lat:' + _adsb.Latitude.toFixed(6) + ', lng:' + _adsb.Longitude.toFixed(6) + '<br>  alt:' + alt + ' </p>';


			// if (infowindowADSB != null) infowindowADSB.close();


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

			if (p_andruavUnit.m_IsGCS == false) {
				markerContent += "<span>" + armedBadge + " <span class='text-success'><strong>" + hlp_getFlightMode(p_andruavUnit) + "</strong></span> </span>";
			}
			else {
				markerContent += "<p> <span class='text-success'>Ground Control Station</span> </p>";
			}

			var vAlt = p_andruavUnit.m_Nav_Info.p_Location.alt;
			var vAlt_abs = p_andruavUnit.m_Nav_Info.p_Location.alt_abs;
			if (vAlt == undefined)
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
			if (vSpeed == null)
			{
				vSpeed='?';
			}
			else
			{
				vSpeed = vSpeed.toFixed(1);
			}
			var vAirSpeed = p_andruavUnit.m_Nav_Info.p_Location.air_speed;
			if (vAirSpeed == null)
			{
				vAirSpeed='?';
			}
			else
			{
				vAirSpeed = vAirSpeed.toFixed(1);
			}
			AndruavLibs.AndruavMap.fn_getElevationForLocation(p_lat, p_lng
				, function (p_elevation, p_lat, p_lng) {
				if (p_elevation!= null) {

					if (window.AndruavLibs.LocalStorage.fn_getMetricSystem() == false) {
						p_elevation = CONST_METER_TO_FEET * p_elevation;
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
					if (p_andruavUnit.m_Swarm.m_following != null)
					{
						var v_andruavUnitLeader = v_andruavClient.m_andruavUnitList.fn_getUnit(p_andruavUnit.m_Swarm.m_following);
						markerContent += '<br><span class="text-warning ">Following:</span><span class="text-success ">'+ v_andruavUnitLeader.m_unitName +'</span>'
					}
					
					if (CONST_MAP_GOOLE === true)
					{
						markerContent += '<br> sea-lvl alt:' + p_elevation + ' m.</p>';
					} 
				}

				infowindow2 = AndruavLibs.AndruavMap.fn_showInfoWindow (infowindow2,markerContent,p_lat,p_lng);
				
			});


		}

		function showAndruavHomePointInfo(p_lat, p_lng, p_andruavUnit) {
			//var wayPointStep = wayPointSteps[i];
			var _style = "", _icon = "";


			var v_contentString = "<p class='img-rounded bg-primary text-white" + _style + "'><strong> Home of " + p_andruavUnit.m_unitName + _icon + "</strong></p><span class='help-block'><small>lat:" + parseFloat(p_andruavUnit.m_Geo_Tags.p_HomePoint.lat).toFixed(6) + ",lng:" + parseFloat(p_andruavUnit.m_Geo_Tags.p_HomePoint.lng).toFixed(6) + "</small></span>";

			infowindow = AndruavLibs.AndruavMap.fn_showInfoWindow(infowindow, v_contentString, p_lat, p_lng);
			// infowindow.setContent(v_contentString);
			// infowindow.setPosition(event.latLng);
			// infowindow.open(map);
		}

		function fn_showWaypointInfo(p_lat, p_lng, p_wayPointStep, p_andruavUnit) {

			//var wayPointStep = wayPointSteps[i];
			var v_style = " css_margin_5px ", v_icon = "";

			var contentString = null;

			var v_footerMenu = "<div class='row'>";
			v_footerMenu += "<div class= 'col-sm-12'><p class='bg-success si-07x'>" + p_andruavUnit.m_unitName + "   " + p_andruavUnit.m_VehicleType_TXT + "</p></div>";
			v_footerMenu += "<div class= 'col-sm-6'><p class='cursor_hand text-primary si-07x' onclick=\"fn_doStartMissionFrom('" + p_andruavUnit.partyID + "'," + p_wayPointStep.m_Sequence + " )\">Start Here</p></div>";
			v_footerMenu += "";

			var v_contentString = "";
			switch (p_wayPointStep.waypointType) {
				case CONST_WayPoint_TYPE_CIRCLE:
					v_contentString = "<p class='img-rounded " + v_style + "'><strong> Circle Seq#" + p_wayPointStep.m_Sequence + v_icon + "</strong></p><span class='help-block'>" + p_wayPointStep.Latitude + "," + p_wayPointStep.Longitude + "</span>";
					v_contentString += "<p class='text-primary'>radius: " + parseInt(p_wayPointStep.m_Radius).toFixed(1) + " m x" + parseInt(p_wayPointStep.m_Turns).toFixed(0) + "</p>";
					v_contentString += v_footerMenu;

					break;
				default:
					v_contentString = "<p class='img-rounded " + v_style + "'><strong> Waypoint Seq#" + p_wayPointStep.m_Sequence + v_icon + "</strong></p><span class='help-block'>" + p_wayPointStep.Latitude + "," + p_wayPointStep.Longitude + "</span>";
					v_contentString += v_footerMenu;
					break;
			}

			// infowindow.setContent(v_contentString);
			// infowindow.setPosition(event.latLng);
			// infowindow.open(map);

			infowindow = AndruavLibs.AndruavMap.fn_showInfoWindow (infowindow, v_contentString, p_lat, p_lng);
		}

		function showGeoFenceInfo(p_lat, p_lng, geoFenceInfo) {
			var _style, _icon;
			if (geoFenceInfo.m_shouldKeepOutside == true) {
				_style = "bg-danger";
				_icon = "&nbsp;<span class='glyphicon glyphicon-ban-circle text-danger css_float_right'></span>";
			}
			else {
				_style = "bg-success";
				_icon = "&nbsp;<span class='glyphicon glyphicon-ok-circle text-success css_float_right'></span>";
			}

			var v_contentString = "<p class='img-rounded " + _style + "'><strong>" + geoFenceInfo.m_geoFenceName + _icon + "</strong></p><span class='help-block'>" + p_lat.toFixed(7) + " " + p_lng.toFixed(7) + "</span>";
			v_contentString += "<div class='row'><div class= 'col-sm-12'><p class='cursor_hand bg-success link-white si-07x' onclick=\"window.open('./mapeditor.html?zoom=" + AndruavLibs.AndruavMap.fn_getZoom() + "&lat=" + p_lat + "&lng=" + p_lng + "', '_blank')\"," + CONST_DEFAULT_ALTITUDE + "," + CONST_DEFAULT_RADIUS + "," + 10 + " )\">Open Geo Fence Here</p></div></div>";
			// infowindow.setContent(v_contentString);
			// infowindow.setPosition(event.latLng);
			// infowindow.open(map);

			infowindow = AndruavLibs.AndruavMap.fn_showInfoWindow (infowindow, v_contentString, p_lat, p_lng);

		}


		function EVT_andruavUnitGeoFenceBeforeDelete(geoFenceInfo) {
			if (geoFenceInfo != null) {
				if (geoFenceInfo.flightPath != null) {
					//geoFenceInfo.flightPath.setMap(null);
					AndruavLibs.AndruavMap.fn_hideItem(geoFenceInfo.flightPath);
				}
			}
			else {
				// hide all

				var keys = Object.keys(v_andruavClient.andruavGeoFences);
				var size = Object.keys(v_andruavClient.andruavGeoFences).length;

				for (var i = 0; i < size; ++i) {
					var geoFenceInfo = v_andruavClient.andruavGeoFences[keys[i]];

					if (geoFenceInfo.flightPath != null) {
						//geoFenceInfo.flightPath.setMap(null);
						AndruavLibs.AndruavMap.fn_hideItem(geoFenceInfo.flightPath);
					}

				}
			}
		}



		function EVT_andruavUnitGeoFenceUpdated(p_andruavUnit, geoFenceInfo) {

			var geoFenceCoordinates = geoFenceInfo.LngLatPoints;

			if (AndruavLibs.AndruavMap.m_isMapInit == false) { // in case map is not loaded
				setTimeout(function () {
					EVT_andruavUnitGeoFenceUpdated(p_andruavUnit, geoFenceInfo);

				}, 800);
			}
			var v_geoFence = null;

			switch (geoFenceInfo.fencetype) {
				case CONST_TYPE_LinearFence:
					v_geoFence = AndruavLibs.AndruavMap.fn_drawPolyline(geoFenceCoordinates, geoFenceInfo.m_shouldKeepOutside);
					// var v_geoFence = new google.maps.Polyline({
					// 	path: geoFenceCoordinates,
					// 	geodesic: true,
					// 	strokeColor: geoFenceInfo.m_shouldKeepOutside == false ? '#32CD32' : '#FF1493', //'#75A4D3':'#F75050',
					// 	strokeOpacity: 0.9,
					// 	strokeWeight: 2
					// });
					geoFenceInfo.flightPath = v_geoFence;
					//v_geoFence.setMap(map);

					if (v_andruavClient.andruavGeoFences.hasOwnProperty(geoFenceInfo.m_geoFenceName) == false) {
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo;
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units = {};
					}
					else {
						var oldgeoFenceInfo = v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName];
						if (oldgeoFenceInfo.flightPath != null) {  // hide path from map
							AndruavLibs.AndruavMap.fn_hideItem(geoFenceInfo.flightPath);
							//geoFenceInfo.flightPath.setMap(null);
						}
						geoFenceInfo.Units = oldgeoFenceInfo.Units; // copy attached units
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo; // assume new fence is updated one.
					}

					//AndruavLibs.AndruavMap.fn_addListenerOnRightClickMarker(v_geoFence, fn_contextMenu);
					
							
					break;

				case CONST_TYPE_PolygonFence:

					// var geoFence = new google.maps.Polygon({
					// 	path: geoFenceCoordinates,
					// 	geodesic: true,
					// 	fillColor: geoFenceInfo.m_shouldKeepOutside == false ? '#32CD32' : '#FF1493', //'#75A4D3':'#F75050',
					// 	//strokeColor: geoFenceInfo.m_shouldKeepOutside==false?'#FFFFFF':'#D3D375',
					// 	strokeOpacity: 1.0,
					// 	fillOpacity: 0.45,
					// 	strokeWeight: 0  // you can use width with violation
					// });
					var v_geoFence = AndruavLibs.AndruavMap.fn_drawPolygon(geoFenceCoordinates, geoFenceInfo.m_shouldKeepOutside);
					
					geoFenceInfo.flightPath = v_geoFence;
					//geoFence.setMap(map);


					if (v_andruavClient.andruavGeoFences.hasOwnProperty(geoFenceInfo.m_geoFenceName) == false) {
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo;
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units = {};
					}
					else {
						var oldgeoFenceInfo = v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName];
						if (oldgeoFenceInfo.flightPath != null) {  // hide path from map
							AndruavLibs.AndruavMap.fn_hideItem(geoFenceInfo.flightPath);
							//geoFenceInfo.flightPath.setMap(null);
						}
						geoFenceInfo.Units = oldgeoFenceInfo.Units; // copy attached units
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo; // assume new fence is updated one.
					}

					// google.maps.event.addListener(geoFence, 'rightclick', fn_contextMenu);

					// google.maps.event.addListener(geoFence, 'click', function (event) {
					// 	showGeoFenceInfo(event, geoFenceInfo);
					// });

					
					break;

				case CONST_TYPE_CylinderFence:

					// var geoFence = new google.maps.Circle({
					// 	fillColor: geoFenceInfo.m_shouldKeepOutside == false ? '#32CD32' : '#FF1493', //'#75A4D3':'#F75050',
					// 	//strokeColor: geoFenceInfo.m_shouldKeepOutside==false?'#FFFFFF':'#D3D375',
					// 	strokeOpacity: 1.0,
					// 	strokeWeight: 0,
					// 	fillOpacity: 0.45,
					// 	map: map,
					// 	center: geoFenceCoordinates[0],
					// 	radius: geoFenceInfo.m_maximumDistance
					// });
					var v_geoFence = AndruavLibs.AndruavMap.fn_drawCircle(geoFenceCoordinates[0], geoFenceInfo.m_maximumDistance, geoFenceInfo.m_shouldKeepOutside);
					
					geoFenceInfo.flightPath = v_geoFence;
					//geoFence.setMap(map);

					if (v_andruavClient.andruavGeoFences.hasOwnProperty(geoFenceInfo.m_geoFenceName) == false) {
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo;
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units = {};
					}
					else {
						var oldgeoFenceInfo = v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName];
						if (oldgeoFenceInfo.flightPath != null) {  // hide path from map
							AndruavLibs.AndruavMap.fn_hideItem(geoFenceInfo.flightPath);
							//geoFenceInfo.flightPath.setMap(null);
						}
						geoFenceInfo.Units = oldgeoFenceInfo.Units; // copy attached units
						v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName] = geoFenceInfo; // assume new fence is updated one.
					}

					break;
			}

			if (v_geoFence != null)
			{
				var _dblClickTimer;
				AndruavLibs.AndruavMap.fn_addListenerOnDblClickMarker(v_geoFence, 
						function (p_lat, p_lng) {
							clearTimeout(_dblClickTimer);
  							_dblClickTimer = null;
							fn_contextMenu (AndruavLibs.AndruavMap.fn_getLocationObjectBy_latlng(p_lat, p_lng));
						});
					
				AndruavLibs.AndruavMap.fn_addListenerOnClickMarker (v_geoFence,
						function (p_lat, p_lng) {
							if (_dblClickTimer != null) {
								return;
							  }
							  _dblClickTimer = setTimeout(() => {
							
								showGeoFenceInfo(p_lat, p_lng, geoFenceInfo);
							
								_dblClickTimer = null;
							  }, 200);

						});
			}
			if (p_andruavUnit != null) 
			{
				// if p_andruavUnit is null then data is loaded from task stored DB system.
				v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units[p_andruavUnit.partyID] = {};
				v_andruavClient.andruavGeoFences[geoFenceInfo.m_geoFenceName].Units[p_andruavUnit.partyID].geoFenceHitInfo =
					{
						hasValue: false,
						fenceName: geoFenceInfo.m_geoFenceName,
						m_inZone: false,
						m_shouldKeepOutside: geoFenceInfo.m_shouldKeepOutside
					}
			}


		}


		var EVT_andruavUnitGeoFenceHit = function (p_andruavUnit, geoFenceHitInfo) {

			var fence = v_andruavClient.andruavGeoFences[geoFenceHitInfo.fenceName];
			if ((fence == undefined) || (fence == null)) {
				v_andruavClient.API_requestGeoFences(p_andruavUnit, geoFenceHitInfo.fenceName);
				return;
			}
			if (fence.Units[p_andruavUnit.partyID] == undefined) fence.Units[p_andruavUnit.partyID] = {};
			fence.Units[p_andruavUnit.partyID].geoFenceHitInfo = geoFenceHitInfo;
			if (p_andruavUnit.m_gui.m_marker == null) return;   // will be updated later when GPS message is recieved from that drone.
			var typeMsg = "info"; var msg = "OK";
			if (geoFenceHitInfo.m_inZone && geoFenceHitInfo.m_shouldKeepOutside) { typeMsg = 'p_error'; msg = "should be Out fence " + geoFenceHitInfo.fenceName; }
			else if (!geoFenceHitInfo.m_inZone && !geoFenceHitInfo.m_shouldKeepOutside) { typeMsg = 'p_error'; msg = "should be In fence " + geoFenceHitInfo.fenceName; }
			Messenger().post({
				type: typeMsg,
				message: p_andruavUnit.m_unitName + ":" + "GeoFenceHit: " + msg
			});
			if (msg == "OK") {

			}
			else {
				v_SpeakEngine.fn_speak("unit " + p_andruavUnit.m_unitName + " " + msg);
			}

			window.AndruavLibs.EventEmitter.fn_dispatch(EE_unitUpdated, p_andruavUnit);
		}


		//////////////////////////////////////////////////////////////////////

		function gui_hidesubmenus() {
			$('div#debugpanel').hide();
			$('#btnConnectURL').hide();
		}

		function gui_init_yawCtrl() {
			//CTRL YAW	
			$('#modal_ctrl_yaw').hide();
			$('#modal_ctrl_yaw').draggable();
			$('#modal_ctrl_yaw').mouseover(function () {
				$('#modal_ctrl_yaw').css('opacity', '1.0');
			});
			$('#modal_ctrl_yaw').mouseout(function () {
				if ($('#modal_ctrl_yaw').attr('opacity') == null) {
					$('#modal_ctrl_yaw').css('opacity', '0.4');
				}
			});
			$('#modal_ctrl_yaw').find('#opaque_btn').click(function () {
				if ($('#modal_ctrl_yaw').attr('opacity') == null) {
					$('#modal_ctrl_yaw').attr('opacity', '1.0');
					$('#modal_ctrl_yaw').css('opacity', '1.0');
				}
				else {
					$('#modal_ctrl_yaw').attr('opacity', null);
				}
			});
			$('#modal_ctrl_yaw').find('#btnGoto').click(function () {
				// assume what there is attribute partyID in the control used to pass parameter
				fn_gotoUnit_byPartyID($('#modal_ctrl_yaw').attr('partyID'));
			});
			$('#modal_ctrl_yaw').find('#btnclose').click(function () {
				$('#modal_ctrl_yaw').attr('opacity', null);
				$('#modal_ctrl_yaw').attr('partyID', null);
				$('#modal_ctrl_yaw').hide();
				$('#modal_ctrl_yaw').find('#btnYaw').unbind("click");
				$('#modal_ctrl_yaw').find('#btnResetYaw').unbind("click");
			});

			$('#modal_ctrl_yaw').find('#yaw_knob_out').click(function (e) {
				e.stopPropagation();
			});
			$('#modal_ctrl_yaw').find('#yaw_knob_out').mousemove(function (e) {
				e.stopPropagation();
			});
		}

		function fn_gui_init_unitList ()
		{
			$('#andruav_unit_list_array_float').draggable();
			$('#andruav_unit_list_array_float').mouseover(function () {
				$('#andruav_unit_list_array_float').css('opacity', '1.0');
			});
			$('#andruav_unit_list_array_float').mouseout(function () {
				$('#andruav_unit_list_array_float').css('opacity', '0.8');
			});
			
		}

		function fn_gui_init_fpvVtrl ()
		{
			$('#modal_fpv').hide();
			$('#modal_fpv').draggable();
			$('#modal_fpv').mouseover(function () {
				$('#modal_fpv').css('opacity', '1.0');
			});
			$('#modal_fpv').mouseout(function () {
				$('#modal_fpv').css('opacity', '0.4');
			});
			$('#modal_fpv').find('#btnclose').click(function () {
				$('#modal_fpv').hide();
			});
			//http://www.bootply.com/XyZeggFcK7

			$('#unitImg_save').click(hlp_saveImage_html);
			$('#modal_fpv').find('#btnGoto').click(hlp_gotoImage_Map);
		}



		function fn_connect() {

			if ((window.AndruavLibs.AndruavAuth.fn_logined() === true) && (v_connectState !== true)) {
				window.AndruavLibs.AndruavAuth.fn_do_logoutAccount($('#txtEmail').val(), $('#txtAccessCode').val());
				if (v_andruavClient != null) {
					v_andruavClient.API_delMe();
				}
				return;
			}
			else 
			{
				window.AndruavLibs.AndruavAuth.fn_do_loginAccount($('#txtEmail').val(), $('#txtAccessCode').val());
			}

			if (window.AndruavLibs.AndruavAuth.logined === false) {
				Messenger().post({
					type: 'p_error',
					message: window.AndruavLibs.AndruavAuth.m_errorMessage
				});

				if (v_connectState == true) {
					setTimeout(fn_connect, 4000);
				}

				return;
			}

			// create a group object
			if (v_andruavClient == null) {

				if (window.AndruavLibs.AndruavAuth.fn_logined() == false) return;
				v_andruavClient = window.AndruavLibs.AndruavClient; //Object.create(AndruavClientSocket.prototype);

				v_andruavClient.partyID = ($('#txtUnitID').val()+$('#txtUnitID_ext').val()).replace('#','_');
				v_andruavClient.unitID = $('#txtUnitID').val();
				v_andruavClient.m_groupName = $('#txtGroupName').val();
				v_andruavClient.fn_init();
				v_andruavClient.m_server_ip = window.AndruavLibs.AndruavAuth.m_server_ip;
				v_andruavClient.m_server_port = window.AndruavLibs.AndruavAuth.m_server_port;
				v_andruavClient.m_server_port_ss = window.AndruavLibs.AndruavAuth.m_server_port; // backward compatibility. SSL should be sent as a separate parameter
				v_andruavClient.server_AuthKey = window.AndruavLibs.AndruavAuth.server_AuthKey;
				v_andruavClient._permissions_ = window.AndruavLibs.AndruavAuth.fn_getPermission();
				v_andruavClient.EVT_onOpen = EVT_onOpen;
				v_andruavClient.EVT_onError = EVT_onError;
				v_andruavClient.EVT_onSend = EVT_onSend;
				v_andruavClient.EVT_onMessage = EVT_onMessage;
				v_andruavClient.EVT_onClose = EVT_onClose;
				v_andruavClient.EVT_onLog 							= EVT_onLog;
				v_andruavClient.fn_onSocketStatus 					= fn_onSocketStatus;
				v_andruavClient.EVT_onDeleted 						= EVT_onDeleted;
				v_andruavClient.EVT_msgFromUnit_GPS 				= EVT_msgFromUnit_GPS;
				v_andruavClient.EVT_msgFromUnit_IMUStatistics 		= EVT_msgFromUnit_IMUStatistics;
				v_andruavClient.EVT_msgFromUnit_IMG 				= EVT_msgFromUnit_IMG;
				v_andruavClient.EVT_msgFromUnit_VIDEO 				= EVT_msgFromUnit_VIDEO;
				//v_andruavClient.EVT_msgFromUnit_RTCVIDEO 			= EVT_msgFromUnit_RTCVIDEO;
				v_andruavClient.EVT_andruavUnitAdded 				= EVT_andruavUnitAdded;
				v_andruavClient.EVT_HomePointChanged 				= EVT_HomePointChanged;
				v_andruavClient.EVT_DistinationPointChanged 		= EVT_DistinationPointChanged;
				v_andruavClient.EVT_andruavUnitError 				= EVT_andruavUnitError;
				v_andruavClient.EVT_andruavUnitGeoFenceUpdated 		= EVT_andruavUnitGeoFenceUpdated;
				v_andruavClient.EVT_andruavUnitGeoFenceHit 			= EVT_andruavUnitGeoFenceHit;
				v_andruavClient.EVT_msgFromUnit_WayPoints 			= EVT_msgFromUnit_WayPoints;
				v_andruavClient.EVT_msgFromUnit_WayPointsUpdated 	= EVT_msgFromUnit_WayPointsUpdated;
				v_andruavClient.EVT_andruavUnitArmedUpdated 		= EVT_andruavUnitArmedUpdated;
				v_andruavClient.EVT_andruavUnitGeoFenceBeforeDelete = EVT_andruavUnitGeoFenceBeforeDelete;
				v_andruavClient.EVT_andruavUnitFCBUpdated 			= EVT_andruavUnitFCBUpdated;
				v_andruavClient.EVT_msgFromUnit_NavInfo 			= EVT_msgFromUnit_NavInfo;
				v_andruavClient.EVT_BadMavlink						= EVT_BadMavlink;
				v_andruavClient.EVT_andruavUnitFlyingUpdated 		= EVT_andruavUnitFlyingUpdated;
				v_andruavClient.EVT_andruavUnitFightModeUpdated 	= EVT_andruavUnitFightModeUpdated;
				v_andruavClient.EVT_andruavUnitVehicleTypeUpdated 	= EVT_andruavUnitVehicleTypeUpdated;
				v_andruavClient.EVT_andruavUnitModuleUpdated 		= EVT_andruavUnitModuleUpdated;
				fn_console_log(c_SOCKET_STATUS);

				v_andruavClient.fn_connect(window.AndruavLibs.AndruavAuth.fn_getSessionID());
			}
			else {
				v_andruavClient.API_delMe();

			}


		};


		function fn_deleteShapesinDB()
		{
			v_andruavClient.API_disableGeoFenceTasks(window.AndruavLibs.AndruavAuth.m_username,v_andruavClient.m_groupName,null,'_drone_',1);
			
			v_andruavClient.API_requestDeleteGeoFences(null,null); // deattach drones from all fences in the group
			setTimeout (function ()
				{
					// because it can take time to update database so an early relead in vehicle will be false.
						v_andruavClient.API_requestReloadLocalGroupGeoFenceTasks (null);
				}, 3000);
		}
	
	

		function fn_submitShapes () 
		{
			const len = v_map_shapes.length;

			for (var i=0; i< len; ++i)
			{
				

				if (
				((v_map_shapes[i].m_geofenceInfo.m_valid !== true)
				&& (v_map_shapes[i].m_geofenceInfo.m_deleted !== true))
				)
	 			{
					fn_do_modal_confirmation('Missing Information','Please enter missing fence data.');
					v_map_shapes[i].setStyle({
							color: '#FE8030'
						});
	 					return ;  // shape is not configured
				}
			}

			v_andruavClient.API_requestDeleteGeoFences(null,null); // deattach drones from all fences in the group
			v_andruavClient.API_disableGeoFenceTasks(window.AndruavLibs.AndruavAuth.m_username,v_andruavClient.m_groupName,null,'_drone_',1);


			for (var i=0; i< len; ++i)
			{
				
				var cmd={};
				const c_shape = v_map_shapes[i];
				
				if (c_shape.m_geofenceInfo.m_deleted === true) continue;
				
				cmd.n = c_shape.m_geofenceInfo.m_geoFenceName;
				cmd.a = c_shape.m_geofenceInfo.isHardFence;
				cmd.o = c_shape.m_geofenceInfo.m_shouldKeepOutside?1:0;
				cmd.r = parseInt(c_shape.m_geofenceInfo.m_maximumDistance);
	
				switch (c_shape.pm.getShape())
				{
					case 'Marker':
					break;
					
					case 'Polygon':
					{
						cmd.t = FENCETYPE_PolygonFence;
						const c_lnglats = c_shape.getLatLngs()[0];

						const len_lnglat = c_lnglats.length;

						for (var j=0; j<len_lnglat; ++j)
						{
							var lnglat = {};
							lnglat.a = c_lnglats[j].lat * 10000000;
							lnglat.g = c_lnglats[j].lng * 10000000;
							cmd[j] = lnglat;
						}

						cmd.c = 4;					
					}
					break;

					case 'Rectangle':
					{
						cmd.t = FENCETYPE_PolygonFence;
						const c_boundary = c_shape.getBounds();

						var lnglat = {};
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
						cmd.t = FENCETYPE_CylindersFence;
						const c_center = c_shape.getLatLng();
						var lnglat = {};
						lnglat.a = c_center.lat;
						lnglat.g = c_center.lng;
						cmd["0"] = lnglat;
						cmd.c=1;
					}
					break;
				
					case 'Line':
					{
						cmd.t = FENCETYPE_LinearFence;
						const c_lnglats = c_shape.getLatLngs();

						const len_lnglat = c_lnglats.length;

						for (var j=0; j<len_lnglat;++j)
						{
							var lnglat = {};
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

				if ((v_andruavClient != null) && (v_andruavClient.fn_isRegistered()==true))
				{
					v_andruavClient.API_saveGeoFenceTasks(window.AndruavLibs.AndruavAuth.m_username,v_andruavClient.m_groupName,null,'_drone_',1,cmd);
				}
				//cmds.push (cmd);
				//cmdtxt = cmdtxt + JSON.stringify(cmd);
			}


			setTimeout (function ()
			{
				v_andruavClient.API_requestReloadLocalGroupGeoFenceTasks (null);
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
		}

		

		function fn_on_ready() {
			//fn_loadMaps();

			if ((typeof(CONST_MAP_GOOLE) == "undefined") || (CONST_MAP_GOOLE === true))
			{
				var v_script = v_G_createElement('script');
				v_script.type='text/javascript';
				
				v_script.src="2a4034903490310033a90d2408a108a12e6924c1310033a9084429713021302129712d9027d924c131002b1133a90844264930212e6908a12e6924c1310033a908a124c131002b1108a12be433a90f812cb927d939310e89108114d13a2424c11ae93931118929710c40110414401a441ef11e4010811189302126491e402be40961384033a937510b642be4234127100af9264927d9297107e91ae91ef1129932c40bd1375105a4264924c12d902d90258424c126492cb90e892b112f442b113490172924c13100"._fn_hexDecode();
				v_G_document.body.append(v_script);
			}
			else
			if ((typeof(CONST_MAP_GOOLE) != "undefined") && (CONST_MAP_GOOLE === false))
			{
				initMap();
			}

			window.AndruavLibs.EventEmitter.fn_subscribe(EE_adsbExchangeReady, this, fn_adsbObjectUpdate);
			window.AndruavLibs.EventEmitter.fn_subscribe(EE_adsbExpiredUpdate, this, fn_adsbExpiredUpdate);
			


			enableDragging();

			// Blink Map Link
			//setInterval (function () { $('#mapeditor_span').toggleClass ('label-warning');}, 3000);
			setInterval(function () { $('#webplugin_span').toggleClass('label-danger'); }, 2000);

			fn_showMap();
			
			if (CONST_MAP_EDITOR !== true) 
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


			$('#gimbaldiv').find('#btnpitchm').click(function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, -2, 0, 0);

			});

			$('#gimbaldiv').find('#btnrollp').click(function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, 0, +2, 0);

			});

			$('#gimbaldiv').find('#btnrollm').click(function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, 0, -2, 0);

			});

			$('#gimbaldiv').find('#btnyawp').click(function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p);
				fn_doGimbalCtrlStep(p_andruavUnit, 0, 0, +2);

			});

			$('#gimbaldiv').find('#btnyawm').click(function () {
				var p = $('#div_video_view').attr('partyID');
				var p_andruavUnit = v_andruavClient.m_andruavUnitList.fn_getUnit(p);
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
			
			if ((QueryString.test != undefined) && (QueryString.test != null)) {
				$('.subblock#command').show();
				$('div#debugpanel').show();
			}

			// LOGIN		
			if ((QueryString.email == null) || (QueryString.accesscode == null)) {
				// window.location.href = "http://example.com";
				$('#txtUnitID').val('GCSMAP_' + fn_generateRandomString(3));

			}
			else {
				//http://127.0.0.1:9980/globalarclight.html?accesscode=myown&email=myown@myown.com&m_groupName=1&m_unitName=GCSWeb1

			}
			if (CONST_MAP_EDITOR !== true) 
            {
				window.AndruavLibs.LocalTelemetry.fn_onPacketReceived = EVT_GCSDataReceived;
				window.AndruavLibs.LocalTelemetry.fn_onWebSocketOpened = EVT_GCSDataOpen;
			}
			
			$("#alert .close").click(function (e) {
				$("#alert").hide();
			});

			$("#alert").hide();

			fn_handleKeyBoard();

		};  // end of onReady

		$(document).ready(fn_on_ready);
