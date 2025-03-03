


export const CONST_MeterToKnot 		    = 0.539957;
export const CONST_KNOT_TO_KM_HOUR      = 1.852; 
export const CONST_FEET_TO_METER 		= 0.30479999;
export const CONST_METER_TO_FEET 		= 3.28084;
export const CONST_METER_TO_MILE        = 2.23694;  //m/s to mph
export const CONST_MILE_TO_METER        = 0.44704;  //m/s to mph
export const CONST_RADIUS_TO_DEGREE 	= 180 / Math.PI;
export const CONST_DEGREE_TO_RADIUS 	= Math.PI / 180;
export const CONST_PTx2				    = Math.PI * 2;


export const CONST_NETWORK_TYPE_UNKNOWN 	= 0;
export const CONST_NETWORK_TYPE_GPRS 	    = 1;
export const CONST_NETWORK_TYPE_EDGE 	    = 2;
export const CONST_NETWORK_TYPE_UMTS 	    = 3; 
export const CONST_NETWORK_TYPE_CDMA 	    = 4; 
export const CONST_NETWORK_TYPE_EVDO_0 	    = 5;
export const CONST_NETWORK_TYPE_EVDO_A 	    = 6;
export const CONST_NETWORK_TYPE_1xRTT 	    = 7; 
export const CONST_NETWORK_TYPE_HSDPA 	    = 8;  
export const CONST_NETWORK_TYPE_HSUPA 	    = 9;  
export const CONST_NETWORK_TYPE_HSPA 	    = 10; 
export const CONST_NETWORK_TYPE_EVDO_B 	    = 12;
export const CONST_NETWORK_TYPE_IDEN 	    = 11;
export const CONST_NETWORK_TYPE_LTE 		= 13;
export const CONST_NETWORK_TYPE_EHRPD 	    = 14;
export const CONST_NETWORK_TYPE_HSPAP 	    = 15;
export var v_NETWORK_TYPE = ['Unknown','GPRS','EDGE','UTMS','CDMA','U+','U+','Unknown','U+','H','H','H+','H+','LTE','EHRPD','HSPAP'];


export const CONST_TELEPHONE_NOTFOUND    = 0;
export const CONST_TELEPHONE_200G        = 1;
export const CONST_TELEPHONE_250G        = 2;
export const CONST_TELEPHONE_275G        = 3;
export const CONST_TELEPHONE_300G        = 4;
export const CONST_TELEPHONE_350G        = 5;
export const CONST_TELEPHONE_375G        = 6;
export const CONST_TELEPHONE_390G        = 7;
export const CONST_TELEPHONE_400G        = 8;
export const v_NETWORK_G_TYPE = ['NA','2','2.5','2.75','3','3.5','3.75','3.9','4.0'];

export function  fn_getTimeSpanDetails (delta)
{

    let ret = {};
    
    // calculate (and subtract) whole days
    ret.days = Math.floor(delta / 86400);
    delta -= ret.days * 86400;

    // calculate (and subtract) whole hours
    ret.hours = Math.floor(delta / 3600) % 24;
    delta -= ret.hours * 3600;

    // calculate (and subtract) whole minutes
    ret.minutes = Math.floor(delta / 60) % 60;
    delta -= ret.minutes * 60;

    // what's left is seconds
    ret.seconds =  Math.floor(delta % 60);  // in theory the modulus is not required

   
    return ret;
}

export function  fn_getTimeSpanDetails_Shortest (date_future, date_now)
{
    if (date_now === 0)
    return "";
    // get total seconds between the times
    const delta = Math.abs(date_future - date_now) / 1000;

    const dt = fn_getTimeSpanDetails (delta);

    return fn_getStringOfTimeDiff_Shortest (dt);
    
}


export function  fn_getTimeDiffDetails_Shortest (dif)
{
    if (isNaN(dif)) return "";
    
    const dt = fn_getTimeSpanDetails (dif);

    return fn_getStringOfTimeDiff_Shortest (dt);
    
}


/**
 * This export function  generate a readable string from a timediff
 * @param {*diff in sec,monthes,days, months, years} dif 
 */
export function  fn_getStringOfTimeDiff_Shortest (dif)
{
    let str = "";
    let displayLowerDigits = false;
    if (!isNaN(dif.days) && (dif.days !== 0))
    {
        str = str + dif.days + 'd:' ;
        displayLowerDigits = true;
    }
    if (displayLowerDigits || (!isNaN(dif.hours) && (dif.hours !== 0)))
    {
        str = str + dif.hours + 'h:' ;
        displayLowerDigits = true;
    }
    if (displayLowerDigits || (!isNaN(dif.minutes) && (dif.minutes !== 0)))
    {
        str = str+ dif.minutes + 'm:' ;
        displayLowerDigits = true;
    }
    if (displayLowerDigits || (!isNaN(dif.seconds) && (dif.seconds !== 0)))
    {
        str = str + dif.seconds.toFixed(0)+ 's' ;
    }

    if (str==='') str='0s';
    return str;
}




//http://chawi3.com/2015/03/03/arraybuffer-to-base64-base64-to-arraybuffer-javascript/

export function  fn_arrayBufferToBase64( buffer ) {
    let binary = '';
    let bytes = new Uint8Array( buffer );
    let len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode( bytes[ i ] );
    }
    return window.btoa( binary );
}

export function  fn_base64ToArrayBuffer(base64) {
    let binary_string =  window.atob(base64);
    let len = binary_string.length;
    let bytes = new Uint8Array( len );
    for (let i = 0; i < len; i++)        {
        bytes[i] = binary_string.charCodeAt(i);
    }
    return bytes.buffer;
}


export function  absAngle(a) 
{
	// this yields correct counter-clock-wise numbers, like 350deg for -370
    return (360 + (a % 360)) % 360;
}
		  
export function  isClockwiseAngle (p_start, p_end)
{
	return (p_start - p_end >= 0 && p_start - p_end <= 180) || (p_start - p_end <= -180) ? true : false;
}
		
export function  fn_calcDistance(lat1, lon1, lat2, lon2) 
{
        const R = 6371e3; // metres
        const φ1 = fn_toRad(lat1);
        const φ2 = fn_toRad(lat2);
        const Δφ = fn_toRad(lat2-lat1);
        const Δλ = fn_toRad(lon2-lon1);

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
}

// Converts numeric degrees to radians
export function  fn_toRad(Value) 
{
    return Value * Math.PI / 180;
}
// http://stackoverflow.com/questions/6965107/converting-between-strings-and-arraybuffers

export function  pad(num, size) {
    const s = "000000000" + num;
    return s.substr(s.length-size);
}

export function  array_to_ArrayBuffer (p_array) 
{
    const len = p_array.length;
    let buf = new ArrayBuffer(len);
    let	bufView= new Uint8Array(buf);
    for (let k=0; k<len; ++k) {
        bufView[k] = p_array[k];
    }

    return buf;
}

export function  fn_Str2BinaryArray (str)
{
	let buf = new ArrayBuffer(str.length); // 2 bytes for each char
	let	bufView = new Uint8Array(buf);
	
	for (let i=0, strLen=str.length; i<strLen; i++) 
	{
		bufView[i] = str.charCodeAt(i);
	}
	
	return bufView;
}


// returns array of bytes
// you need to convert it to Uint8Array if you want a Blob
export function  fn_str2ByteArray (str)
{
    let bytes = [];
	for (let i=0, strLen=str.length; i<strLen; i++) 
	{
		bytes.push(str.charCodeAt(i));
	}
    return bytes;
}

// contact two buffers & ADDs ZERO in between for Andruav compatibility
export function  fn_concatTypedArrays(a, b, addzero) { // a, b TypedArray of same type
    let c = new (a.constructor)(a.length + b.length + 1);
    c.set(a, 0);
    if (addzero === true)
    {
        c[a.length]=0;
        c.set(b, a.length + 1 );
    }
    else
    {
        c.set(b, a.length);
    }
    return c;
}

export function  fn_concatBuffers(a, b, addzero) {
    return fn_concatTypedArrays(
        new Uint8Array(a.buffer || a), 
        new Uint8Array(b.buffer || b),
        addzero
    ).buffer;
}

export function  prv_extractString(data,startIndex,endIndex)
{
        let out = {}; // {'text':"", 'nextIndex': startIndex};
		
        let i = startIndex;
        while ( i < endIndex && data[i] !== 0) {
            i++;
        }
        if (i === endIndex) 
        {
            return  {'text':"", 'nextIndex': startIndex};
        }

        const text = new TextDecoder().decode(data.slice(startIndex, i));
        out.text = text;
        out.nextIndex = i+1;
        return out;

}



export function  fn_encrypt(num)
{
	return  (num * num) ;
}


export function  fn_decrypt(num)
{
	return  Math.sqrt(num);
}


Image.prototype.rotate = function(angle) {
    let c = document.createElement("canvas");
    c.width = this.width;
    c.height = this.height;    
    let ctx = c.getContext("2d");    
    ctx.rotate(angle);
    let imgData = ctx.createImageData(this.width, this.height);
    ctx.putImageData(imgData);
    return new Image(imgData);
}


export const _fn_hexEncode = function(){
    let hex, i,v;

    let result = "";
    for (i=0; i<this.length; i++) {
		v = this.charCodeAt(i);
		v =fn_encrypt(v);
        hex = v.toString(16);
        result += ("000"+hex).slice(-4);
    }

    return result
}

export const _fn_hexDecode = function(){
    let j,v;
    let hexes = this.match(/.{1,4}/g) || [];
    let back = "";
    for(j = 0; j<hexes.length; j++) {
		v = parseInt(hexes[j], 16);
		v = fn_decrypt(v);
        back += String.fromCharCode(v);
    }

    return back;
}


export function   fn_loadCss (path) {
        let style = document.createElement('link');
        style.rel = 'stylesheet';
        style.href = './css/' + path + '.css';
        document.head.appendChild(style);
}




export function  fn_doNothing (a)
{
	//fn_console_log ('fn_doNothing);
	return ;
}


export function  fn_copyToClipboard(text) {
    window.prompt("URL For Direct Setup [KEEP IT SAFE]\r\nCopy to clipboard: Ctrl+C, Enter", text);
}



export function  fn_findWithAttributeIndex(array, attr, value) {
    for(let i = 0; i < array.length; i += 1) {
        if(array[i][attr] === value) {
            return i;
        }
    }
    return -1;
}

export function  fn_saveAs(data, filename, type) {
    let file = new Blob([data], {type: type});
    if (window.navigator.msSaveOrOpenBlob) // IE10+
        window.navigator.msSaveOrOpenBlob(file, filename);
    else { // Others
        let a = document.createElement("a"),
                url = URL.createObjectURL(file);
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(function() {
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

export function  fn_saveData (fileURL, fileName) {
    //http://muaz-khan.blogspot.com.eg/2012/10/save-files-on-disk-using-javascript-or.html
    // for non-IE
    if (!window.ActiveXObject) {
        let save = document.createElement('a');
        save.href = fileURL;
        save.target = '_blank';
        save.download = fileName || 'unknown';
        save.click();
    }

    // for IE
    else if (!window.ActiveXObject && document.execCommand)     {
        let _window = window.open(fileURL, '_blank');
        _window.document.close();
        _window.document.execCommand('SaveAs', true, fileName || fileURL);
        _window.close();
    }
}



export function  fn_getOS() {
    let userAgent = window.navigator.userAgent,
        platform = window.navigator.platform,
        macosPlatforms = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K'],
        windowsPlatforms = ['Win32', 'Win64', 'Windows', 'WinCE'],
        iosPlatforms = ['iPhone', 'iPad', 'iPod'],
        os = null;
  
    if (macosPlatforms.indexOf(platform) !== -1) {
      os = 'Mac OS';
    } else if (iosPlatforms.indexOf(platform) !== -1) {
      os = 'iOS';
    } else if (windowsPlatforms.indexOf(platform) !== -1) {
      os = 'Windows';
    } else if (/Android/.test(userAgent)) {
      os = 'Android';
    } else if (!os && /Linux/.test(platform)) {
      os = 'Linux';
    }
  
    return os;
  }


export function  fn_getNetworkType (p_networkType)
{
    switch (p_networkType) {
        case CONST_NETWORK_TYPE_CDMA:
        case CONST_NETWORK_TYPE_IDEN:
            return CONST_TELEPHONE_200G;


        case CONST_NETWORK_TYPE_GPRS:
            return CONST_TELEPHONE_250G;
        
        case CONST_NETWORK_TYPE_EDGE:
            return CONST_TELEPHONE_275G;


            /**
                 From this link https://en.wikipedia.org/wiki/Evolution-Data_Optimized ..CONST_NETWORK_TYPE_EVDO_0 & CONST_NETWORK_TYPE_EVDO_A
                 EV-DO is an evolution of the CDMA2000 (IS-2000) standard that supports high data rates.

                 Where CDMA2000 https://en.wikipedia.org/wiki/CDMA2000 .CDMA2000 is a family of 3G[1] mobile technology standards for sending voice,
                 data, and signaling data between mobile phones and cell sites.
            */
        case CONST_NETWORK_TYPE_1xRTT: //~ 50-100 kbps
        case CONST_NETWORK_TYPE_UMTS:
            return CONST_TELEPHONE_300G;
        
        case CONST_NETWORK_TYPE_EVDO_0:
        case CONST_NETWORK_TYPE_EVDO_A:
        case CONST_NETWORK_TYPE_HSDPA: //~ 2-14 Mbps
        case CONST_NETWORK_TYPE_HSUPA: //~ 1-23 Mbps
        case CONST_NETWORK_TYPE_HSPA:  //~ 700-1700 kbps
            return CONST_TELEPHONE_350G;
        
        case CONST_NETWORK_TYPE_EVDO_B:
            return CONST_TELEPHONE_375G;
        
        case CONST_NETWORK_TYPE_EHRPD:
        case CONST_NETWORK_TYPE_HSPAP:
                //Log.d("Type", "3g");
                //For 3g HSDPA , HSPAP(HSPA+) are main  networktype which are under 3g Network
                //But from other constants also it will 3g like HSPA,HSDPA etc which are in 3g case.
                //Some cases are added after  testing(real) in device with 3g enable data
                //and speed also matters to decide 3g network type
                //https://en.wikipedia.org/wiki/4G#Data_rate_comparison
            return CONST_TELEPHONE_390G;
        
        case CONST_NETWORK_TYPE_LTE:
                //No specification for the 4g but from wiki
                //I found(LTE (Long-Term Evolution, commonly marketed as 4G LTE))
                //https://en.wikipedia.org/wiki/LTE_(telecommunication)
            return CONST_TELEPHONE_400G;
        
        default:
                return CONST_TELEPHONE_NOTFOUND;
        }
    }


 export function  fn_isChrome()
 {
    if (navigator.userAgent.indexOf("Chrome") !== -1) return true;

    return false;
 }  
 
 export function  fn_isFireFox()
 {
    if (navigator.userAgent.indexOf("Firefox") !== -1) return true;

    return false;
 }

 export function  fn_isEdge()
 {
    if (navigator.userAgent.indexOf("Chrome") !== -1) return true;

    return false;
 }
    

