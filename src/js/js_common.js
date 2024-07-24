/*******************************************************************
 * 
 *  Coomon Functions used by all pages... much like js_helper 
 *   but code relaated not generic functionality or 3rdparty
 * 
 * 
 */

import React    from 'react';
import ReactDOM from "react-dom/client";


import $ from 'jquery';
import * as bootstrap from 'bootstrap/dist/js/bootstrap.bundle.min.js';
import Modal from 'bootstrap/js/dist/modal';



export function  fn_generateRandomString(length)
{
	// http://stackoverflow.com/questions/1349404/generate-random-string-characters-in-javascript
	
	return Array(length+1).join((Math.random().toString(36)+'00000000000000000').slice(2, 18)).slice(0, length);

}

export function showModal (id, show)
{
	const modal = new Modal($(id)); // Instantiates your modal
	if (show === true && (modal !== null || modal !== undefined))
	{
		modal.show();
	}
	
	if (show === false && (modal !== null || modal !== undefined))
	{
		modal.hide();
	}
}


export function showDialog (id, show)
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