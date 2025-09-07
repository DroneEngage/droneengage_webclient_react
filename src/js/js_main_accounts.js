import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.min.js';

import * as js_common from './js_common.js'
import * as js_andruavMessages from './js_andruavMessages'
import { EVENTS as js_event } from './js_eventList.js'
import * as js_siteConfig from './js_siteConfig'
import { js_eventEmitter } from './js_eventEmitter'


export function gui_alert(title, message, level) {
    $('#alert #title').html(title);
    $('#alert #title').html(title);
    $('#alert #msg').html(message);
    $('#alert').removeClass();
    $('#alert').addClass('alert alert-' + level);
    $('#alert').show();
}


export function fn_do_modal_confirmation(p_title, p_message, p_callback, p_yesCaption, p_style) {
    if (p_style == null) {
        p_style = "bg-success text-white";
    }
    $('#modal_saveConfirmation').children().find('h4#title').html(p_title);
    $('#modal_saveConfirmation').children().find('h4#title').removeClass();
    $('#modal_saveConfirmation').children().find('h4#title').addClass("modal-title " + p_style);
    $('#modal_saveConfirmation').children().find('div.modal-body p#conf').html(p_message);
    $('#modal_saveConfirmation').children().find('div.modal-body p#res').html("");
    $('#modal_saveConfirmation').children().find('button#geo_btn_confirm').off('click');
    $('#modal_saveConfirmation').children().find('button#geo_btn_confirm').unbind('click');
    $('#modal_saveConfirmation').children().find('button#geo_btn_confirm').click(p_callback);
    if (p_yesCaption != null) {
        $('#modal_saveConfirmation').children().find('button#geo_btn_confirm').html(p_yesCaption);
    }
    js_common.showModal($('#modal_saveConfirmation'), true);


}



export function fn_on_account_ready() {
    $(function () {
        $('head').append('<link href="/images/de/favicon.ico" rel="shortcut icon" type="image/x-icon" />');
        $(document).prop('title', js_siteConfig.CONST_TITLE);
    });

    //triggered when modal is about to be shown
    $('#deletemodal').on('show.bs.modal', function (e) {

        //get data-id attribute of the clicked element
        let pwdid = $(e.relatedTarget).data('pwdid');

        //populate the textbox
        $(e.currentTarget).find('#Heading').text("Delete access code " + pwdid + "?");
        $(e.currentTarget).attr('pwdid', pwdid);
    });

    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_Created, this,
        function (p_sender, p_msg) {
            let v_Message = "<p className='text-success'>Access Code Created Successfully.</p>";
            if (p_msg.hasOwnProperty(js_andruavMessages.CONST_ACCESS_CODE_PARAMETER.toString()) === true) {
                v_Message += "<p className='text-success'>Access Code: <span  className='text-warning'><strong>" + p_msg[js_andruavMessages.CONST_ACCESS_CODE_PARAMETER.toString()] + "</strong></span></p>"

            }
            $('#modal_saveConfirmation').children().find('div.modal-body p#res').html(v_Message);
        });

    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_Regenerated, this,
        function (p_sender, p_msg) {
            let v_Message = "<p className='text-success'>New Access Code Created Successfully.";
            if (p_msg.hasOwnProperty(js_andruavMessages.CONST_ACCESS_CODE_PARAMETER.toString()) === true) {
                v_Message += "<p className='text-success'>Access Code: <span  className='text-warning'><strong>" + p_msg[js_andruavMessages.CONST_ACCESS_CODE_PARAMETER.toString()] + "</strong></span></p>"

            }

            $('#modal_saveConfirmation').children().find('div.modal-body p#res').html(v_Message);
        });


    js_eventEmitter.fn_subscribe(js_event.EE_Auth_Account_BAD_Operation, this,
        function (p_sender, p_msg) {
            if (p_msg !== null && p_msg !== undefined) {
                let v_Message = "<p className='text-danger'>Operation Failed: <strong>" + p_msg[js_andruavMessages.CONST_ERROR_MSG.toString()] + "</strong></p>";
                if (p_msg.hasOwnProperty(js_andruavMessages.CONST_ACCESS_CODE_PARAMETER.toString()) === true) {
                    v_Message += "<p className='text-success'>Access Code: <span  className='text-warning'><strong>" + p_msg[js_andruavMessages.CONST_ACCESS_CODE_PARAMETER.toString()] + "</strong></span></p>"

                }

                $('#modal_saveConfirmation').children().find('div.modal-body p#res').html(v_Message);

            }
            else {
                $('#modal_saveConfirmation').children().find('div.modal-body p#res').html("<p className='text-danger'>Operation Failed: <strong> Cannot Reach Server </strong></p>");
            }

        });
}
