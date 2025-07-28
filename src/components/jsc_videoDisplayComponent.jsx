import $ from 'jquery';

import React from 'react';

import FileSaver from 'file-saver';

import { js_globals } from '../js/js_globals.js';
import { js_eventEmitter } from '../js/js_eventEmitter'
import * as js_common from '../js/js_common.js'
import * as js_helpers from '../js/js_helpers'
import * as js_andruavUnit from '../js/js_andruavUnit'
import * as js_andruavMessages from '../js/js_andruavMessages'

import { fn_showMap, fn_gotoUnit_byPartyID, fn_takeLocalImage, fn_startrecord, fn_showVideoMainTab } from '../js/js_main'
import ClssCtrlGPIO_Flash from './gadgets/jsc_ctrl_gpio_flash.jsx'
import ClssCtrlObjectTracker from './gadgets/jsc_ctrl_tracker_button.jsx'
import ClssCtrlObjectTrackerAI from './gadgets/jsc_ctrl_tracker_ai_button.jsx'
import ClssCtrlVideoFPS from './gadgets/jsc_ctrl_video_fps_control.jsx'

class ClssCVideoScreen extends React.Component {

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

        
        // --- Mouse Drawing Instance Variables ---
        this.isDrawing = false;
        this.startX = 0;
        this.startY = 0;
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
        this.canvasRef = React.createRef();
        this.m_rotation = 0;

        this.m_rotations = [0, 90, 180, 270];
        this.m_local_rotations = ["rotate(0deg)", "rotate(90deg)", "rotate(180deg)", "rotate(270deg)"];
        this.m_timerID = null;

        js_eventEmitter.fn_subscribe(js_globals.EE_videoStreamRedraw, this, this.fn_videoRedraw);
        js_eventEmitter.fn_subscribe(js_globals.EE_DetectedTarget, this, this.fn_targetDetected);
        js_eventEmitter.fn_subscribe(js_globals.EE_cameraFlashChanged, this, this.fn_flashChanged);
        js_eventEmitter.fn_subscribe(js_globals.EE_cameraZoomChanged, this, this.fn_zoomChanged);
        
    }


    fn_gotoUnit_byPartyID(v_e) {
        fn_showMap();
        fn_gotoUnit_byPartyID(this.props.obj.v_unit);
    }


    fnl_switchcam(e, p_obj) {
        js_globals.v_andruavClient.API_SwitchCamera(this.props.obj.v_unit, p_obj.v_track);
    }


    fnl_takeLocalImage(e) {
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (c_andruavUnit === null || c_andruavUnit === undefined) {
            return;
        }


        if ((c_andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track].mmRTC !== null)) {
            fn_takeLocalImage(c_andruavUnit, this.props.obj.v_track);
        }
        else {
            fn_takeLocalImage(c_andruavUnit, this.props.obj.v_track);
        }

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
        js_eventEmitter.fn_dispatch(js_globals.EE_videoStreamRedraw, { 'andruavUnit': p_andruavUnit, 'v_track': p_activeTrack });
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
        js_globals.v_andruavClient.API_CONST_RemoteCommand_streamVideo(v_andruavUnit, false, v_talk.number, this.props.obj.v_track);
        v_andruavUnit.m_Video.VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
        this.forceUpdate();
    }



    fn_videoRedraw(p_me, p_obj) {
        if (p_me.props.obj.v_unit !== p_obj.andruavUnit.partyID) {
            return;
        }
        if (p_me.props.obj.v_track !== p_obj.v_track) {
            return;
        }
        p_me.forceUpdate();
    }



    fn_targetDetected(p_me, p_unit) {
        //CODEBLOCK_START
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
            // used to test behavior after removing code and as double check
            return;
        }

        if (p_me.props.obj.v_unit !== p_unit.partyID) {
            return;
        }

        p_me.fnl_canvas(p_unit.m_DetectedTargets.m_targets);
        //CODEBLOCK_END
    }

    fn_flashChanged(p_me, p_obj) {
        if (p_me.props.obj.v_unit !== p_obj.p_unit.partyID) {
            return;
        }

        // flash value: f
        if ((!p_obj.p_jmsg.hasOwnProperty('f'))
            && (typeof p_obj.p_jmsg['f'] !== 'number')) return;

        p_me.state.m_flash = p_obj.p_jmsg['f'];
        js_common.fn_console_log("Flash Updated", p_me.state.m_flash);
        p_me.forceUpdate();
    }

    fn_zoomChanged(p_me, p_obj) {
        if (p_me.props.obj.v_unit !== p_obj.p_unit.partyID) {
            return;
        }

        // zoom value: b
        if ((!p_obj.p_jmsg.hasOwnProperty('b'))
            && (typeof p_obj.p_jmsg['b'] !== 'number')) return;

        p_me.state.m_zoom = (p_obj.p_jmsg['b'] !== 0.0);
        js_common.fn_console_log("Zoom Updated", p_me.state.m_zoom);
        p_me.forceUpdate();
    }

    fn_opacity() {
        $('#css_video_ctrl_panel').on("mouseover", function () {
            $('#css_video_ctrl_panel').css('opacity', '1.0');
        });
        $('#css_video_ctrl_panel').mouseout(function () {
            $('#css_video_ctrl_panel').css('opacity', '0.2');
        });

    }

    fn_lnkVideo() {
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        const c_talk = c_andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track];
        const v_video = window.document.getElementById("videoObject" + c_talk.targetVideoTrack);
        if (v_video === null || v_video === undefined) return;
        v_video.srcObject = c_talk.stream;
    }

    fnl_canvas(p_targets) {
        //CODEBLOCK_START
        if (js_globals.CONST_EXPERIMENTAL_FEATURES_ENABLED === false) {
            // used to test behavior after removing code and as double check
            return;
        }

        if (this.m_timerID !== null && this.m_timerID !== undefined) {
            clearTimeout(this.m_timerID);
        }
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        const c_talk = c_andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track];
        const c_canvas = $('canvas#canvasoObject' + c_talk.targetVideoTrack)[0];
        if (c_canvas == null) return;
        const c_ctx = c_canvas.getContext('2d');
        c_ctx.font = "8px Arial";
        c_ctx.textAlign = "center";
        c_ctx.fillStyle = "yellow";

        c_ctx.clearRect(0, 0, c_canvas.width, c_canvas.height);

        this.m_timerID = setTimeout(function () {
            c_ctx.clearRect(0, 0, c_canvas.width, c_canvas.height);
        }, 2000);

        const c_list = p_targets.m_list;
        const c_len = c_list.length;
        for (let i = 0; i < c_len; ++i) {

            const p_target = c_list[i];
            const c_x1 = p_target.x1 * c_canvas.width;
            const c_y1 = p_target.y1 * c_canvas.height;
            const c_x2 = (p_target.x2) * c_canvas.width;
            const c_y2 = (p_target.y2) * c_canvas.height;
            c_ctx.strokeStyle = 'rgb(200, 0, 0)';
            c_ctx.strokeRect(c_x1, c_y1, c_x2, c_y2);
            c_ctx.fillText(p_target.m_name, c_x1 + c_x2 / 2, c_y1 + c_y2 / 2);
        }

        //CODEBLOCK_END
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


    fnl_isFullScreen() {

        return (
            window.innerHeight === window.screen.height ||
            (window.screenTop === 0 && window.screenY === 0)
        );
    }

    fnl_requestFullScreen(e) {
        const c_ele = window.document.getElementById("div_video_control");
        js_common.fn_console_log("fnl_requestFullScreen");
        if (this.fnl_isFullScreen()) {
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

    fnl_zoomInOut(e, p_zoomIn, p_obj) {
        js_common.fn_console_log("p_cameraIndex: " + JSON.stringify(p_obj));
        js_globals.v_andruavClient.API_CONST_RemoteCommand_zoomCamera(p_obj.v_unit, p_obj.v_track, p_zoomIn, null, 0.1);
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
        js_globals.v_andruavClient.API_TurnMobileFlash (p_obj.v_unit, v_flashValue, p_obj.v_track);

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
        js_globals.v_andruavClient.API_CONST_RemoteCommand_rotateVideo(v_andruavUnit, this.m_rotations[this.m_rotation], this.props.obj.v_track);
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

        this.forceUpdate();
    }

    fnl_rotate_local(v_e) {


        this.m_rotation = (this.m_rotation + 1) % 4;
        this.m_transform_rotated = "transform: '" + this.m_local_rotations[this.m_rotation] + "'";
        this.videoRef.current.style.transform =

        this.forceUpdate();
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
        

        // Now, you can process the finalized rectangle and send it
        const v_x1 = (newLeft / containerRect.width).toFixed(3);
        const v_y1 = (newTop / containerRect.height).toFixed(3);
        const normalizedWidth = (newWidth / containerRect.width).toFixed(3);
        const normalizedHeight = (newHeight / containerRect.height).toFixed(3);

        if ((normalizedWidth < 0.01) || (normalizedHeight < 0.01)) return ;
        
        const c_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        if (c_andruavUnit == null) {
            return;
        }

        js_globals.v_andruavClient.API_SendTrackCRegion(c_andruavUnit,
            parseFloat(v_x1),
            parseFloat(v_y1),
            parseFloat(normalizedWidth),
            parseFloat(normalizedHeight)
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

        // first strop tracking
        //js_globals.v_andruavClient.API_StopTracking (c_andruavUnit);

        // send new points
        const c_dim = e.currentTarget.getBoundingClientRect();
        const v_x1 = ((e.nativeEvent.x - c_dim.left) / c_dim.width).toFixed(3);
        const v_y1 = ((e.nativeEvent.y - c_dim.top) / c_dim.height).toFixed(3);;
        js_globals.v_andruavClient.API_SendTrackPoint(c_andruavUnit, parseFloat(v_x1), parseFloat(v_y1), parseFloat("0.05"));
    }

    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_videoStreamRedraw, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_DetectedTarget, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_cameraFlashChanged, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_cameraZoomChanged, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_onWebRTC_Video_Statistics, this);
    }

    // drawVideoFrame (me) {
    //     const ctx = me.canvasRef.current.getContext('2d');
    //     ctx.drawImage(me.videoRef.current, 0, 0, v_canvas.width, v_canvas.height);
    //     ctx.scale(-1,-1); //flip the image horizontally

    //   };

    componentDidMount() {
        this.fn_lnkVideo();
        const me = this;

        this.state.m_update = 1;

        //const intervalId = window.setInterval(this.drawVideoFrame, 1000 / 30,this); // 30 FPS
        //this.setState({ intervalId });


    }

    componentDidUpdate() {
        this.fn_lnkVideo();
        this.fn_opacity();
        js_common.fn_console_log("componentDidUpdate");
    }


    render() {
        const andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.props.obj.v_unit);
        const talk = andruavUnit.m_Video.m_videoactiveTracks[this.props.obj.v_track];
        const divID = "cam_" + andruavUnit.partyID + this.props.obj.v_track;  //party ids can start with numbers you need to adda prefix
        if (talk.VideoStreaming === js_andruavUnit.CONST_VIDEOSTREAMING_OFF) {
            return (
                <div id={divID} className={"tab-pane fade in " + this.props.first}>
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

        let btn_fullscreen, btn_fullscreen_txt;

        if (this.fnl_isFullScreen()) {
            btn_fullscreen = "cursor_hand css_fullscreen_active";
            btn_fullscreen_txt = "Exit Full Screen";
        }
        else {
            btn_fullscreen = "cursor_hand css_fullscreen";
            btn_fullscreen_txt = "Full Screen";
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
                        id="btn_fullscreen"
                        className={btn_fullscreen + " cursor_hand"}
                        alt={btn_fullscreen_txt}
                        title={btn_fullscreen_txt}
                        onClick={(e) => this.fnl_requestFullScreen(e)}
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
                <div key={key + "15"} className="d-flex justify-content-center align-items-center p-0 m-0 ms-1">
                    <ClssCtrlGPIO_Flash p_unit={andruavUnit} title='flash light' />
                </div>
            </div>
        );



        return (
            <div id={divID} className={"css_videoScreen tab-pane fade " + this.props.first}>
                <h4 key="h" className="bg-primary text-white rounded_6px">
                    {andruavUnit.m_unitName + ' track: ' + andruavUnit.m_Video.m_videoTracks[this.props.obj.v_index].ln}
                </h4>
                {v_btns}
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
                    className="css_videoContainer"
                    //onClick={(e) => this.fnl_div_clicked(e)}
                    ref={this.drawingContainerRef}
                    onMouseDown={(e) => this.fnl_div_mouseDown(e)}
                    onMouseUp={(e) => this.fnl_div_mouseUp(e)}
                >
                    <video
                        autoPlay
                        className="videoObject"
                        id={"videoObject" + talk.targetVideoTrack}
                        style={video_style}
                        data-number={talk.number}
                        ref={this.videoRef}
                    ></video>
                </div>
            </div>
        );






    }
}


export class ClssCVideoControl extends React.Component {
    constructor() {
        super();
        this.state = {
            m_videoScreens: {},
            lastadded: null
        };

        js_eventEmitter.fn_subscribe(js_globals.EE_videoStreamStarted, this, this.fn_videoStarted);
        js_eventEmitter.fn_subscribe(js_globals.EE_videoStreamStopped, this, this.fn_videoStopped);
    }


    fn_videoStarted(me, p_obj) {
        p_obj.andruavUnit.m_Video.m_videoactiveTracks[p_obj.talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_ON;

        let vid = p_obj.andruavUnit.partyID + p_obj.talk.targetVideoTrack;
        if (me.state.m_videoScreens.hasOwnProperty(vid) === false) {
            me.state.m_videoScreens[vid] = {};
            const c_screen = me.state.m_videoScreens[vid];
            c_screen.v_unit = p_obj.andruavUnit.partyID;
            c_screen.v_track = p_obj.talk.targetVideoTrack;
            c_screen.v_index = js_helpers.fn_findWithAttributeIndex(p_obj.andruavUnit.m_Video.m_videoTracks, "id", p_obj.talk.targetVideoTrack);
            me.state.lastadded = vid;
        }

        fn_showVideoMainTab();

        me.forceUpdate();

        // SIMULATE a click to activate the link.
        // bug: if the tab is already selected then click will not be effective.
        // you need to deactivate the tab in case it is active
        // eq(0) is another bug as using [0] will return a DOM object and you need a JQuery object.
        $('#div_video_control ul li a[href="#cam_' + p_obj.andruavUnit.partyID + me.state.m_videoScreens[vid].v_track + '"]').eq(0).parent().removeClass("active");

        // simulate click
        //$('#div_video_control ul li a[href="#cam_' + p_obj.andruavUnit.partyID + me.state.m_videoScreens[vid].v_track + '"]')[0].click();


    }


    fn_videoStopped(me, obj) {

        obj.andruavUnit.m_Video.m_videoactiveTracks[obj.talk.targetVideoTrack].VideoStreaming = js_andruavUnit.CONST_VIDEOSTREAMING_OFF;
        if (me.state.m_videoScreens.hasOwnProperty(obj.andruavUnit.partyID) === false) {
            me.state.m_videoScreens[obj.andruavUnit.partyID] = undefined;
        }

        me.forceUpdate();
    }


    componentWillUnmount() {
        js_eventEmitter.fn_unsubscribe(js_globals.EE_videoStreamStarted, this);
        js_eventEmitter.fn_unsubscribe(js_globals.EE_videoStreamStopped, this);
    }


    render() {
        const arr = Object.keys(this.state.m_videoScreens);

        let len = arr.length;

        if (len === 0) {
            return (
                <div> Please press camera icon to start streaming to see video.</div>
            );
        }

        let out_h = [];
        let out_b = [];
        for (let i = 0; i < len; ++i) {

            let _first = "";
            const v_key = arr[i];
            const v_obj = this.state.m_videoScreens[v_key];
            if (v_obj !== null && v_obj !== undefined) {
                const andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(v_obj.v_unit);


                if (this.state.lastadded === v_key) {
                    _first = "active show";
                }
                else {
                    _first = "";
                }

                out_h.push(<li key={'h' + v_key} className="nav-item">
                    <a className={"nav-link user-select-none  " + _first} data-bs-toggle="tab" href={'#cam_' + andruavUnit.partyID + v_obj.v_track}>{andruavUnit.m_unitName + ' #' + v_obj.v_index}</a>
                </li>);
                out_b.push(<ClssCVideoScreen key={v_key} first={_first} obj={v_obj} />);
            }
        }


        return (
            <div className="container-fluid localcontainer">
                <ul className="nav  nav-tabs">
                    {out_h}
                </ul>
                <div id={this.key + "videoTabContent"} className="tab-content">
                    {out_b}
                </div>
            </div>
        )
    }

}

