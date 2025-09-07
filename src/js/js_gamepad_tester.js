import $ from 'jquery';
import * as js_siteConfig from './js_siteConfig'

export function fn_on_ready() {

	$(function () {
		$('head').append('<link href="/images/de/favicon.ico" rel="shortcut icon" type="image/x-icon" />');
		$(document).prop('title', js_siteConfig.CONST_TITLE);
	});
}