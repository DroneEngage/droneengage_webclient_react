import React    from 'react';

export class Clss_CTRL_Layout extends React.Component {
    constructor(props) {
        super(props);
        this.state = {};
        js_localStorage.fn_getDisplayMode();

        fn_applyControl();
    }

    render() {
        const v_display_mode = js_localStorage.fn_getDisplayMode()%5+1;
        return (
            <div id="main_btn_group"  role="group" aria-label="Basic example">
                <button type="button" id="btn_showSettings" className="btn btn-success btn-sm ctrlbtn" title='Show/Hide Settings Section' onClick={(e) => fn_showSettings()}><strong>SETTINGS</strong></button>
                <button type="button" id="btn_showMap" className="btn btn-danger btn-sm ctrlbtn" title='Show Map (ctrl+m)' onClick={(e) => fn_showMap()}><strong>MAP</strong></button>
                <button type="button" id="btn_showVideo" className="btn btn-warning btn-sm ctrlbtn" title='Show Video (ctrl+r)' onClick={(e) => fn_showVideoMainTab()}><strong>CAMERA</strong></button>
                <button type="button" id="btn_showControl" className="btn btn-primary btn-sm ctrlbtn d-none d-sm-inline" title='Change Screen Layout' onClick={(e) => fn_showControl(false)}><strong>{'DISPLAY-' + v_display_mode}</strong></button>
                <button type="button" id="btn_showControl_small" className="btn btn-primary btn-sm ctrlbtn  d-inline d-sm-none" title='Change Screen Layout' onClick={(e) => fn_showControl(true)}><strong>{'display-' + v_display_mode}</strong></button>
            </div>
        );
    }
}
