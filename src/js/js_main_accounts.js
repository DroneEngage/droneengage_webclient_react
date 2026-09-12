import $ from 'jquery';
import 'jquery-ui-dist/jquery-ui.min.js';

import * as js_siteConfig from './config/js_siteConfig.js'


export function fn_on_account_ready() {
    $(function () {
        $('head').append('<link href="/images/de/favicon.ico" rel="shortcut icon" type="image/x-icon" />');
        $(document).prop('title', js_siteConfig.CONST_TITLE);
    });
}
