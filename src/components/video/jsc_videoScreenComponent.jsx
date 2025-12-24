import $ from 'jquery';

import React from 'react';

import FileSaver from 'file-saver';

import { js_globals } from '../../js/js_globals.js';
import { js_eventEmitter } from '../../js/js_eventEmitter.js'
import * as js_common from '../../js/js_common.js'
import {EVENTS as js_event} from '../../js/js_eventList.js'
import * as js_andruavUnit from '../../js/js_andruavUnit.js'
import * as js_andruavMessages from '../../js/protocol/js_andruavMessages.js'

import { fn_showMap, fn_gotoUnit_byPartyID, fn_takeLocalImage, fn_startrecord, fn_showVideoMainTab } from '../../js/js_main.js'
import ClssCtrlGPIO_Flash from '../gadgets/jsc_ctrl_gpio_flash.jsx'
import ClssCtrlObjectTracker from '../gadgets/jsc_ctrl_tracker_button.jsx'
import ClssCtrlVideoFPS from '../gadgets/jsc_ctrl_video_fps_control.jsx'
import { ClssCtrlDrone_Altitude_Ctrl } from '../gadgets/jsc_ctrl_altitude_control.jsx'
import { ClssCtrlDrone_Speed_Ctrl } from '../gadgets/jsc_ctrl_speed_control.jsx'
import ClssCtrlDrone_FlightMode_Ctrl from '../gadgets/jsc_ctrl_flight_mode_control.jsx'
import ClssCtrlDistanceToMeControl from '../gadgets/jsc_ctrl_distance_to_me_control.jsx'
import ClssCtrlOpacityControl from '../gadgets/jsc_ctrl_opacity_control.jsx'
import ClssCVideoHUDOverlay from './jsc_videoHUDOverlayComponent.jsx'

import ClssCVideoTrackerLayer from './jsc_videoTrackerLayer.jsx'

export default class ClssCVideoScreen extends React.Component {

    constructor() {
        super();
        this.state = {
            m_flash: js_andruavMessages.CONST_FLASH_DISABLED,
            m_flash_enabled: false,
            m_zoom: 0.0,
            intervalId: null,
            // isDrawing, startX, startY, currentRect are now instance variables
            drawnRectangles: [], // Still in state if you want to render persistent rectangles
            m_update: 0 // Keep a dummy state update for force-re-renders if needed elsewhere.
        };

        
        this.m_flag_mounted = false;

        
        // --- Mouse Drawing Instance Variables ---
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
        this.startClientX = 0;
        this.startClientY = 0;
        // Use an object to hold current drawing rectangle's visual properties
        this.currentDrawingRect = {
            left: 0,
            top: 0,
            width: 0,
            height: 0
        };
        // --- End Mouse Drawing Instance Variables ---


        

        this.key = Math.random().toString();
        this.drawingContainerRef = React.createRef(); // Ref to your main div

        this.m_mirrored = false;
        this.m_transform_rotated = "";
        this.m_transform_mirrored = "";
        this.videoRef = React.createRef();
        this.m_rotation = 0;

        this.m_rotations = [0, 90, 180, 270];
        this.m_local_rotations = ["rotate(0deg)", "rotate(90deg)", "rotate(180deg)", "rotate(270deg)"];

        // Video fit modes: contain, width, height, stretch
        this.m_videoFitModes = ["video_fit_contain", "video_fit_width", "video_fit_height", "video_fit_stretch"];
        this.m_videoFitModeLabels = ["Fit (Contain)", "Fit Width (100%)", "Fit Height (100%)", "Stretch (Fill)"];
        this.m_videoFitModeIcons = ["bi bi-arrows-expand css_large_icon text-primary", "bi bi-arrow-left-right css_large_icon text-success", "bi bi-arrow-down-up css_large_icon text-primary", "bi bi-arrows-fullscreen css_large_icon text-success"];
        this.m_videoFitModeIndex = 0;

        js_eventEmitter.fn_subscribe(js_event.EE_videoStreamRedraw, this, this.fn_videoRedraw);
        js_eventEmitter.fn_subscribe(js_event.EE_cameraFlashChanged, this, this.fn_flashChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_cameraZoomChanged, this, this.fn_zoomChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_videoStreamStarted, this, this.fn_videoStreamChanged);
        js_eventEmitter.fn_subscribe(js_event.EE_videoStreamStopped, this, this.fn_videoStreamChanged);
        
    }
    
    fn_videoStreamChanged(p_me, p_obj) {
        // Re-render when video stream starts or stops for this track
        if (p_me.props.obj.v_unit === p_obj.andruavUnit.getPartyID() && 
            p_me.props.obj.v_track === p_obj.talk.targetVideoTrack) {
            if (p_me.m_flag_mounted) {
                p_me.setState({ 'm_update': p_me.state.m_update + 1 });
            }
        }
    }


    componentDidMount() {
        this.fn_lnkVideo();
        const me = this;

        this.m_flag_mounted = true;

        // Listen for fullscreen changes to update toolbar visibility
        this.fnl_handleFullscreenChange = () => {
            if (me.m_flag_mounted) {
                me.setState({ 'm_update': me.state.m_update + 1 });
            }
        };
        document.addEventListener('fullscreenchange', this.fnl_handleFullscreenChange);
        document.addEventListener('webkitfullscreenchange', this.fnl_handleFullscreenChange);
        document.addEventListener('mozfullscreenchange', this.fnl_handleFullscreenChange);
        document.addEventListener('MSFullscreenChange', this.fnl_handleFullscreenChange);
    }


    componentDidUpdate() {
        this.fn_lnkVideo();
        js_common.fn_console_log("componentDidUpdate");
    }


    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_event.EE_videoStreamRedraw, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_cameraFlashChanged, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_cameraZoomChanged, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_onWebRTC_Video_Statistics, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_videoStreamStarted, this);
        js_eventEmitter.fn_unsubscribe(js_event.EE_videoStreamStopped, this);

        // Remove fullscreen event listeners
        document.removeEventListener('fullscreenchange', this.fnl_handleFullscreenChange);
        document.removeEventListener('webkitfullscreenchange', this.fnl_handleFullscreenChange);
        document.removeEventListener('mozfullscreenchange', this.fnl_handleFullscreenChange);
        document.removeEventListener('MSFullscreenChange', this.fnl_handleFullscreenChange);
    }

    
    fn_gotoUnit_byPartyID(v_e) {
        fn_showMap();
        fn_gotoUnit_byPartyID(this.props.obj.v_unit);
    }


    fnl_switchcam(e, p_obj) {
        js_globals.v_andruavFacade.API_SwitchCamera(this.props.obj.v_unit, p_obj.v_track);
    }


    fnl_takeLocalImage(e) {
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (!c_andruavUnit) return;
        fn_takeLocalImage(c_andruavUnit, this.props.obj.v_track);
    }


    fnl_stoprecord(p_andruavUnit, p_activeTrack, p_blob) {

        let filename = 'video_';
        if (p_andruavUnit !== null && p_andruavUnit !== undefined) {
            filename = filename + p_andruavUnit.m_unitName;
        }

        // TODO implement
        FileSaver.saveAs(p_blob, filename);
        let talk = p_andruavUnit.m_Video.m_videoactiveTracks[p_activeTrack];
        talk.videoRecording = false;
        js_eventEmitter.fn_dispatch(js_event.EE_videoStreamRedraw, { 'andruavUnit': p_andruavUnit, 'v_track': p_activeTrack });
    }


    fnl_recordVideo(v_e) {
        let v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (v_andruavUnit === null || v_andruavUnit === undefined) {
            return;
        }

        let v_me = this;
        let v_activeTrack = v_andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track];
        //if ((v_activeTrack.mmRTC !== null && v_activeTrack.mmRTC !== undefined) && (v_activeTrack.mmRTC.isStoppedRecording === false))
        if ((v_activeTrack.videoRecording === true) && (v_activeTrack.recorderObject !== null && v_activeTrack.recorderObject !== undefined)) {
            const recorder = v_activeTrack.recorderObject;
            recorder.stopRecording(() => {
                const videoBlob = recorder.getBlob();
                v_me.fnl_stoprecord(v_andruavUnit, v_me.props.obj.v_track, videoBlob);
                v_activeTrack.recorderObject = null;
            });
        }
        else {
            js_common.fn_console_log("start recording");
            fn_startrecord(v_andruavUnit, this.props.obj.v_track);

        }
    }



    fnl_stopVideo(v_e) {
        let v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;
        const v_talk = v_andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track];
        v_talk.hangup(true);
        js_globals.v_andruavFacade.API_CONST_RemoteCommand_streamVideo(v_andruavUnit, false, v_talk.number, this.props.obj.v_track);
        v_andruavUnit.m_Video.VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
        
        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }



    fn_videoRedraw(p_me, p_obj) {
        if (p_me.props.obj.v_unit !== p_obj.andruavUnit.getPartyID()) {
            return;
        }
        if (p_me.props.obj.v_track !== p_obj.v_track) {
            return;
        }
        if (p_me.m_flag_mounted === false)return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }



    fn_flashChanged(p_me, p_obj) {
        if (p_me.props.obj.v_unit !== p_obj.p_unit.getPartyID()) {
            return;
        }

        // flash value: f
        if ((!p_obj.p_jmsg.hasOwnProperty('f'))
            && (typeof p_obj.p_jmsg['f'] !== 'number')) return;

        p_me.state.m_flash = p_obj.p_jmsg['f'];
        js_common.fn_console_log("Flash Updated", p_me.state.m_flash);
        if (p_me.m_flag_mounted === false)return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }

    fn_zoomChanged(p_me, p_obj) {
        if (p_me.props.obj.v_unit !== p_obj.p_unit.getPartyID()) {
            return;
        }

        // zoom value: b
        if ((!p_obj.p_jmsg.hasOwnProperty('b'))
            && (typeof p_obj.p_jmsg['b'] !== 'number')) return;

        p_me.state.m_zoom = (p_obj.p_jmsg['b'] !== 0.0);
        js_common.fn_console_log("Zoom Updated", p_me.state.m_zoom);
        if (p_me.m_flag_mounted === false)return ;
        p_me.setState({'m_update': p_me.state.m_update +1});
    }

    // Convert a client (screen) coordinate to normalized coordinates within the rendered video area (0..1)
    // Returns null if the client point is outside the video content rect.
    // Applies inverse of local display transforms (rotation, mirroring) to map back to source video coordinates.
    fn_normalizeClientPointToVideo(clientX, clientY) {
        const videoEl = this.videoRef && this.videoRef.current;
        if (!videoEl) return null;
        const vr = videoEl.getBoundingClientRect();
        if (vr.width <= 0 || vr.height <= 0) return null;
        // Coordinates relative to rendered video box (display space)
        const xd = (clientX - vr.left) / vr.width;
        const yd = (clientY - vr.top) / vr.height;
        if (xd < 0 || xd > 1 || yd < 0 || yd > 1) return null;

        // Inverse rotation: map displayed (xd, yd) back to source (xr, yr)
        let xr = xd;
        let yr = yd;
        const rotIdx = this.m_rotation % 4;
        if (rotIdx === 1) {           // 90deg
            xr = yd;
            yr = 1 - xd;
        } else if (rotIdx === 2) {    // 180deg
            xr = 1 - xd;
            yr = 1 - yd;
        } else if (rotIdx === 3) {    // 270deg
            xr = 1 - yd;
            yr = xd;
        }

        // Inverse mirror (scaleX)
        if (this.m_mirrored === true) {
            xr = 1 - xr;
        }

        // Clamp
        xr = Math.max(0, Math.min(1, xr));
        yr = Math.max(0, Math.min(1, yr));
        return { x: xr, y: yr };
    }

    fn_lnkVideo() {
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        const c_talk = c_andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track];
        const v_video = window.document.getElementById("videoObject" + c_talk.targetVideoTrack);
        if (v_video === null || v_video === undefined) return;
        v_video.srcObject = c_talk.stream;
    }

    fnl_requestPictureInPicture(p_andruavUnit, videoTrackID) {
        const c_talk = p_andruavUnit.m_Video.m_videoactiveTracks[videoTrackID];
        const c_videoctrl = '#videoObject' + c_talk.targetVideoTrack;
        const c_video = $(c_videoctrl)[0];
        if (c_video === null || c_video === undefined) {
            return;
        }

        c_video.requestPictureInPicture();

    }

    fnl_requestPIP(e) {
        const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);

        if (v_andruavUnit === null || v_andruavUnit === undefined) {
            return;
        }


        if ((v_andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track].mmRTC != null)) {
            this.fnl_requestPictureInPicture(v_andruavUnit, this.props.obj.v_track);
        }
        else {
            this.fnl_requestPictureInPicture(v_andruavUnit, this.props.obj.v_track);

        }
    }


    fnl_isVideoFullScreen() {
        const c_ele = this.drawingContainerRef.current;
        if (!c_ele) return false;
        
        return (
            document.fullscreenElement === c_ele ||
            document.webkitFullscreenElement === c_ele ||
            document.mozFullScreenElement === c_ele ||
            document.msFullscreenElement === c_ele
        );
    }

    fnl_requestVideoFullScreen(e) {
        const c_ele = this.drawingContainerRef.current;
        if (!c_ele) return;
        
        if (this.fnl_isVideoFullScreen()) {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
            else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            }
            else if (document.webkitCancelFullScreen) {
                document.webkitCancelFullScreen();
            }
            else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
        }
        else {
            if (c_ele.requestFullscreen) {
                c_ele.requestFullscreen();
            }
            else if (c_ele.mozRequestFullScreen) {
                c_ele.mozRequestFullScreen();
            }
            else if (c_ele.webkitRequestFullScreen) {
                c_ele.webkitRequestFullScreen();
            }
            else if (c_ele.msRequestFullscreen) {
                c_ele.msRequestFullscreen();
            }
        }
    }

    fnl_toggleVideoFitMode(e) {
        this.m_videoFitModeIndex = (this.m_videoFitModeIndex + 1) % this.m_videoFitModes.length;
        js_common.fn_console_log("Video fit mode: " + this.m_videoFitModeLabels[this.m_videoFitModeIndex]);
        if (this.m_flag_mounted === false) return;
        this.setState({ 'm_update': this.state.m_update + 1 });
    }

    fnl_zoomInOut(e, p_zoomIn, p_obj) {
        js_common.fn_console_log("p_cameraIndex: " + JSON.stringify(p_obj));
        js_globals.v_andruavFacade.API_CONST_RemoteCommand_zoomCamera(p_obj.v_unit, p_obj.v_track, p_zoomIn, null, 0.1);
    }

    fnl_flashOnOff (e, p_obj)
    {
        let v_flashValue = js_andruavMessages.CONST_FLASH_OFF
        if (this.state.m_flash === js_andruavMessages.CONST_FLASH_OFF)
        {   
            v_flashValue = js_andruavMessages.CONST_FLASH_ON;
        }else if (this.state.m_flash === js_andruavMessages.CONST_FLASH_ON)
        {   
            v_flashValue = js_andruavMessages.CONST_FLASH_OFF;
        }
        else
        {
            // disabled.
            return ; 
        }
        js_common.fn_console_log ("fnl_flashOnOff p_cameraIndex: " + JSON.stringify(p_obj) + "  " + v_flashValue);
        js_globals.v_andruavFacade.API_TurnMobileFlash (p_obj.v_unit, v_flashValue, p_obj.v_track);

        this.state.m_flash = v_flashValue;
    }

    fnl_trackOnOff (e,obj)
    {
        console.log(obj);
    }

    fnl_rotate(v_e) {
        let v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (v_andruavUnit === null || v_andruavUnit === undefined) return;
        this.m_rotation = (this.m_rotation + 1) % 4;
        js_globals.v_andruavFacade.API_CONST_RemoteCommand_rotateVideo(v_andruavUnit, this.m_rotations[this.m_rotation], this.props.obj.v_track);
    }

    fnl_mirror_local(v_e) {
        if (this.m_mirrored === true) {
            this.m_mirrored = false;
            this.m_transform_mirrored = "scaleX(1)";
        }
        else {
            this.m_mirrored = true;
            this.m_transform_mirrored = "scaleX(-1)";
        }

        if (this.m_flag_mounted === false)return ;
        this.setState({'m_update': this.state.m_update +1});
    }

    fnl_rotate_local(v_e) {


        this.m_rotation = (this.m_rotation + 1) % 4;
        this.m_transform_rotated = "transform: '" + this.m_local_rotations[this.m_rotation] + "'";
        this.videoRef.current.style.transform =

        this.setState({'m_update': this.state.m_update +1});
    }

    fnl_div_mouseDown(e) {
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (c_andruavUnit == null) {
            return;
        }
        if (!c_andruavUnit.m_tracker.m_enable_gui_tracker) return ;
        if (e.button !== 0) return;

        const containerRect = this.drawingContainerRef.current.getBoundingClientRect();
        this.startX = e.clientX - containerRect.left; // Store in instance variable
        this.startY = e.clientY - containerRect.top; // Store in instance variable
        this.startClientX = e.clientX;
        this.startClientY = e.clientY;
        this.isDrawing = true; // Store in instance variable

        // Initialize currentDrawingRect
        this.currentDrawingRect = {
            left: this.startX,
            top: this.startY,
            width: 0,
            height: 0
        };
        
    }

    
    fnl_div_mouseUp(e) {
        if (!this.isDrawing) return; // Use instance variable

        this.isDrawing = false; // Reset instance variable
        
        const containerRect = this.drawingContainerRef.current.getBoundingClientRect();
        const currentX = e.clientX - containerRect.left;
        const currentY = e.clientY - containerRect.top;

        const newLeft = Math.min(this.startX, currentX);
        const newTop = Math.min(this.startY, currentY);
        const newWidth = Math.abs(currentX - this.startX);
        const newHeight = Math.abs(currentY - this.startY);

        // Update currentDrawingRect for the final position (it's what will be rendered)
        this.currentDrawingRect = {
            left: newLeft,
            top: newTop,
            width: newWidth,
            height: newHeight
        };
        

        // Compute normalized rect within the video content area using client coordinates
        const p1 = this.fn_normalizeClientPointToVideo(this.startClientX, this.startClientY);
        const p2 = this.fn_normalizeClientPointToVideo(e.clientX, e.clientY);

        if (p1 == null || p2 == null) {
            // Drag did not occur fully within video content; ignore
            return;
        }

        const x1 = Math.min(p1.x, p2.x);
        const y1 = Math.min(p1.y, p2.y);
        const w = Math.abs(p2.x - p1.x);
        const h = Math.abs(p2.y - p1.y);

        if ((w < 0.01) || (h < 0.01)) return ;
        
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (c_andruavUnit == null) {
            return;
        }

        js_globals.v_andruavFacade.API_SendTrackCRegion(
            c_andruavUnit,
            parseFloat(x1.toFixed(3)),
            parseFloat(y1.toFixed(3)),
            parseFloat(w.toFixed(3)),
            parseFloat(h.toFixed(3))
        );
        
    }
    
    fnl_div_clicked(e) {
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
            // used to test behavior after removing code and as double check
            return;
        }

        js_common.fn_console_log("x:" + e.nativeEvent.offsetX + "y:" + e.nativeEvent.offsetY);
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (c_andruavUnit == null) {
            return;
        }

        // send new points
        const p = this.fn_normalizeClientPointToVideo(e.clientX, e.clientY);
        if (p == null) return;
        js_globals.v_andruavFacade.API_SendTrackPoint(
            c_andruavUnit,
            parseFloat(p.x.toFixed(3)),
            parseFloat(p.y.toFixed(3)),
            parseFloat("0.05")
        );
    }

    render() {
        const andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        const talk = andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track];
        const divID = "cam_" + andruavUnit.getPartyID() + this.props.obj.v_track;  //party ids can start with numbers you need to adda prefix
        
        // Check if this tab is currently active by looking at the DOM element
        let activeClass = this.props.first;
        const existingElement = document.getElementById(divID);
        if (existingElement && existingElement.classList.contains('active')) {
            activeClass = "active show";
        }
        
        if (talk.VideoStreaming === js_andruavUnit.CONST_VIDEOSTREAMING_OFF) {
            return (
                <div id={divID} className={"css_videoScreen tab-pane fade in " + activeClass}>
                    <h4 key="h" className='bg-danger text-white rounded_6px'>{andruavUnit.m_unitName}</h4>
                    <div key="d" >NO VIDEO</div>
                </div>
            );
        }

        let css_switchCam;
        let css_switchCam_title;
        if (andruavUnit.m_Video.supportCameraSwitch(this.props.obj.v_index)) {
            css_switchCam = "cursor_hand css_camera_switch";
            css_switchCam_title = "Switch between Front & Back Cameras";
        }
        else {
            css_switchCam = 'hidden';
            css_switchCam_title = '';
        }

        let css_zoomCam = '';
        let css_flashCam = '';
        let css_flashCam_title = '';
        let css_rotateCam = '';
        if (andruavUnit.m_Video.supportZoom(this.props.obj.v_index)) {
            css_zoomCam = ' text-success ';
        }
        else {
            css_zoomCam = ' hidden ';
        }

        if (andruavUnit.m_Video.supportRotation(this.props.obj.v_index)) {
            css_rotateCam = "cursor_hand ";
        }
        else {
            css_rotateCam = 'hidden';
        }


        if (andruavUnit.m_Video.supportFlashing(this.props.obj.v_index)) {
            if (this.state.m_flash === js_andruavMessages.CONST_FLASH_ON) {
                css_flashCam = "cursor_hand css_camera_flash_on";
                css_flashCam_title = "Flash On";
            }
            else if (this.state.m_flash === js_andruavMessages.CONST_FLASH_OFF) {
                css_flashCam = "cursor_hand css_camera_flash_off";
                css_flashCam_title = "Flash Off";
            }
            else {
                // state was initialized disabled and this is the first tie to setup it.
                this.state.m_flash = js_andruavMessages.CONST_FLASH_OFF;
                css_flashCam = "cursor_hand css_camera_flash_off";
                css_flashCam_title = "Flash Off";
            }
            this.m_flash_enabled = true;
        }
        else {
            css_flashCam = " hidden ";
            this.m_flash_enabled = false;
        }




        let btn_videorecordClass;

        if (talk.videoRecording !== true) {
            btn_videorecordClass = "cursor_hand  css_recvideo_ready";
        }
        else {
            btn_videorecordClass = "cursor_hand  css_recvideo_active";
        }

        let btn_video_fullscreen, btn_video_fullscreen_txt;

        if (this.fnl_isVideoFullScreen()) {
            btn_video_fullscreen = "cursor_hand css_video_fullscreen_active";
            btn_video_fullscreen_txt = "Exit Video Full Screen";
        }
        else {
            btn_video_fullscreen = "cursor_hand css_video_fullscreen";
            btn_video_fullscreen_txt = "Video Full Screen";
        }


        const video_style = {
            transform: this.m_local_rotations[this.m_rotation] + " " + this.m_transform_mirrored
        };


        const key = this.key;
        let v_btns = [];

        v_btns.push(
            <div key={key + "btn"} id="css_video_ctrl_panel" className="d-flex flex-row css_padding_zero">
                <div key={key + "16"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <ClssCtrlVideoFPS p_unit={andruavUnit} track_id={this.props.obj.v_track}/>
                </div>
                <div key={key + "1"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btnclose"
                        className="cursor_hand css_video_close"
                        alt="Close Camera"
                        title="Close Camera"
                        onClick={(e) => this.fnl_stopVideo(e)}
                    />
                </div>
                <div key={key + "2"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btnGoto"
                        className="cursor_hand css_goto_drone"
                        alt="Goto Agent"
                        title="Goto Agent"
                        onClick={(e) => this.fn_gotoUnit_byPartyID(e)}
                    />
                </div>
                <div key={key + "4"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btnPIP"
                        className="cursor_hand css_video_pip"
                        alt="Picture in Picture"
                        title="Picture in Picture"
                        onClick={(e) => this.fnl_requestPIP(e)}
                    />
                </div>
                <div key={key + "5"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btn_video_fullscreen"
                        className={btn_video_fullscreen}
                        alt={btn_video_fullscreen_txt}
                        title={btn_video_fullscreen_txt}
                        onClick={(e) => this.fnl_requestVideoFullScreen(e)}
                    />
                </div>
                <div key={key + "6"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btnSwitchCam"
                        className={css_switchCam + " cursor_hand"}
                        alt={css_switchCam_title}
                        title={css_switchCam_title}
                        onClick={(e) => this.fnl_switchcam(e, this.props.obj)}
                    />
                </div>
                <div key={key + "7"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btn_videorecord"
                        className={btn_videorecordClass + " cursor_hand"}
                        alt="Record Web"
                        title="Record Web"
                        onClick={(e) => this.fnl_recordVideo(e)}
                    />
                </div>
                <div key={key + "8"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btn_takeimage"
                        className="cursor_hand css_camera_ready"
                        alt="Take Snapshot"
                        title="Take Snapshot"
                        onClick={(e) => this.fnl_takeLocalImage(e)}
                    />
                </div>
                <div key={key + "9"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <i className={css_zoomCam + " bi-zoom-in cursor_hand css_large_icon "} title="Zoom In" onClick={(e) => this.fnl_zoomInOut(e, true, this.props.obj)}></i>
                </div>
                <div key={key + "10"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <i className={css_zoomCam + " bi-zoom-out cursor_hand css_large_icon "} title="Zoom Out" onClick={(e) => this.fnl_zoomInOut(e, false, this.props.obj)}></i>
                </div>
                <div key={key + "11"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btn_mirrorX"
                        className={css_rotateCam + " css_camera_mirrorX cursor_hand"}
                        alt="Mirror"
                        title="Mirror"
                        onClick={(e) => this.fnl_mirror_local(e)}
                    />
                </div>
                <div key={key + "12"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btn_rotate"
                        className={css_rotateCam + " css_camera_rotate cursor_hand"}
                        alt="Rotate"
                        title="Rotate"
                        onClick={(e) => this.fnl_rotate_local(e)}
                    />
                </div>
                <div key={key + "13"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <img
                        id="btn_flash"
                        className={css_flashCam + " cursor_hand"}
                        alt="Flash (Tourch)"
                        title={css_flashCam_title}
                        onClick={(e) => this.fnl_flashOnOff(e, this.props.obj)}
                    />
                </div>
                <div key={key + "14"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <ClssCtrlObjectTracker p_unit={andruavUnit} title='object tracker' />
                </div>
                <div key={key + "5c"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <i
                        id="btn_video_fit_mode"
                        className={"cursor_hand " + this.m_videoFitModeIcons[this.m_videoFitModeIndex]}
                        alt={this.m_videoFitModeLabels[this.m_videoFitModeIndex]}
                        title={this.m_videoFitModeLabels[this.m_videoFitModeIndex]}
                        onClick={(e) => this.fnl_toggleVideoFitMode(e)}
                    ></i>
                </div>
                <div key={key + "5d"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <ClssCtrlOpacityControl id="btn_opacity_ctrl" />
                </div>
                <div key={key + "15"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <ClssCtrlGPIO_Flash p_unit={andruavUnit} title='flash light' />
                </div>
            </div>
        );



        const isVideoFullScreen = this.fnl_isVideoFullScreen();

        return (
            <div id={divID} className={"css_videoScreen tab-pane fade " + activeClass}>
                <h4 key="h" className="bg-primary text-white rounded_6px">
                    {andruavUnit.m_unitName + ' track: ' + andruavUnit.m_Video.m_videoTracks[this.props.obj.v_index].ln}
                </h4>
                {!isVideoFullScreen && v_btns}
                <div key="d2" className="row">
                    <div id="gimbaldiv" className="col-4">
                        <div>
                            <button key="btnpitchp" id="btnpitchp" type="button" className="btn btn-primary btn-sm">
                                P +
                            </button>
                            <button key="btnrollp" id="btnrollp" type="button" className="btn btn-primary btn-sm">
                                R +
                            </button>
                            <button key="btnyawp" id="btnyawp" type="button" className="btn btn-primary btn-sm">
                                Y +
                            </button>
                        </div>
                        <div>
                            <button key="btnpitchm" id="btnpitchm" type="button" className="btn btn-primary btn-sm">
                                P -
                            </button>
                            <button key="btnrollm" id="btnrollm" type="button" className="btn btn-primary btn-sm">
                                R -
                            </button>
                            <button key="btnyawm" id="btnyawm" type="button" className="btn btn-primary btn-sm">
                                Y -
                            </button>
                        </div>
                    </div>
                </div>
                <div
                    key={"tv" + talk.targetVideoTrack}
                    id={'css_tvideo-div' + talk.targetVideoTrack}
                    className={"css_videoContainer" + (isVideoFullScreen ? " is_fullscreen" : "")}
                    ref={this.drawingContainerRef}
                    onMouseDown={(e) => this.fnl_div_mouseDown(e)}
                    onMouseUp={(e) => this.fnl_div_mouseUp(e)}
                >
                    {isVideoFullScreen && (
                        <div className="css_fullscreen_toolbar show_toolbar">
                            {v_btns}
                        </div>
                    )}
                    <video
                        autoPlay
                        className={"videoObject " + this.m_videoFitModes[this.m_videoFitModeIndex]}
                        id={"videoObject" + talk.targetVideoTrack}
                        style={video_style}
                        data-number={talk.number}
                        ref={this.videoRef}
                    ></video>
                    <ClssCVideoTrackerLayer
                        id={"canvasoObject" + talk.targetVideoTrack} 
                        p_videoRef={this.videoRef}
                        p_obj={this.props.obj}
                        zIndex={210}
                    />
                    <ClssCVideoHUDOverlay
                        p_unit={andruavUnit}
                        p_videoRef={this.videoRef}
                        p_containerRef={this.drawingContainerRef}
                    />
                    <ClssCtrlDrone_Altitude_Ctrl
                        p_unit={andruavUnit}
                        isHUD={true}
                        x="10px"
                        y="10px"
                        originX="right"
                        width="150px"
                        height="30px"
                        style={{zIndex: 220}}
                    />
                    <ClssCtrlDrone_Speed_Ctrl
                        p_unit={andruavUnit}
                        isHUD={true}
                        x="10px"
                        y="45px"
                        originX="right"
                        width="150px"
                        height="30px"
                        style={{zIndex: 220}}
                    />
                    <ClssCtrlDrone_FlightMode_Ctrl
                        p_unit={andruavUnit}
                        isHUD={true}
                        x="10px"
                        y="80px"
                        originX="right"
                        width="150px"
                        height="30px"
                        style={{zIndex: 220}}
                    />
                    <ClssCtrlDistanceToMeControl
                        p_unit={andruavUnit}
                        isHUD={true}
                        x="10px"
                        y="115px"
                        originX="right"
                        width="150px"
                        height="30px"
                        style={{zIndex: 220}}
                    />
                </div>
            </div>
        );
    }
}

