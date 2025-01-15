import {js_eventEmitter} from './js_eventEmitter'
import {js_globals} from './js_globals.js'
import * as js_helpers from './js_helpers'
import $ from 'jquery'; 


    class v_adsbObject
    {   
        constructor ()
        {

        }

        static getInstance() {
            if (!v_adsbObject.instance) {
                v_adsbObject.instance = new v_adsbObject();
            }
            return v_adsbObject.instance;
        }

        update (_obj)
        {
            if (_obj.PosTime !== this.PosTime)
            {   // sometimes data is chached at the site itself.
                // if so then dont update our timer monitor.
                this.m_lastActiveTime = _obj.m_lastActiveTime;
            }
            else
            {
                js_common.fn_console_log ("Repeated");
            }
            this.Id = _obj.Id;
            this.Icao = _obj.Icao;
            //A description of the aircraft’s model
            this.ModelDescription = _obj.Mdl;
            //The manufacturer’s name. This is looked up via a database based on the ICAO code. 
            this.Manufacturer = _obj.Man;
            // https://en.wikipedia.org/wiki/Transponder_(aeronautics)
            if (_obj.hasOwnProperty('Sqk'))
            {
                this.Sqk = _obj.Sqk;
            }
            else
            {
                this.Sqk = "";
            }
            if (_obj.hasOwnProperty('Spd'))
            {
                this.Speed = _obj.Spd * js_helpers.CONST_KNOT_TO_KM_HOUR;
            }
            else
            {
                this.Speed = 0;
            }
            if (_obj.hasOwnProperty('Gnd'))
            {
                this.Ground = _obj.Gnd;
            }
            else
            {
                this.Ground = false;
            }
            if (_obj.hasOwnProperty('Help'))
            {
                // serious issue
                this.Help = _obj.Help;
            }
            else
            {
                this.Help = false;
            }
            this.Longitude = _obj.Long;
            this.Latitude = _obj.Lat;
            if (_obj.hasOwnProperty('Alt'))
            {
                // The altitude in feet at standard pressure. (broadcast by the aircraft)
                this.Altitude = _obj.Alt * js_helpers.CONST_FEET_TO_METER;
            }
            else
            {
                this.Altitude = 0.0;
            }

            // Vertical speed in feet per minute. Broadcast by the aircraft.
            if (_obj.hasOwnProperty('Vsi'))
            {
                this.VerticalSpd = _obj.Vsi * js_helpers.CONST_FEET_TO_METER / 60;
                // vertical speed is barometric, 1 = vertical speed is geometric. Default to barometric until told otherwise.
                this.IsVerticalSpeedGeometric = _obj.VsiT;
            }
            else
            {
                this.VerticalSpd = 0;
            }

            if (_obj.hasOwnProperty('Trak'))
            {
                this.Heading = _obj.Trak;
            }
            else
            {
                this.Heading = 0;
            }
        }

    } 



    export class v_ADSB_Exchange {
        
        constructor ()
        {
            this.ADSB_UpdateTimeOut = 10000;
            this.ADSB_RefreshRate = 8000; 
            this.ADSB_DroneRefreshRate = 8000;
            this.v_url = "https://public-api.adsbexchange.com/VirtualRadar/AircraftList.json?";
            this.lng=0;
            this.lat=0;
            this.radius=0;

            this.__callsTimeTable = {};

            this.adsbObjectList = {};

            js_eventEmitter.fn_subscribe (js_globals.EE_onPreferenceChanged, this, this.fn_onPreferenceChanged);

            const me = this;
            setInterval(function () {
                // dont call 
                if ((Me.lat === null || Me.lat === undefined) || (Me.radius === 0)) return ;
    
                Me.fn_getADSBData(Me.lat,Me.lng,undefined,Me.radius);
                
             }, Me.ADSB_RefreshRate);
        }

        static getInstance() {
            if (!v_adsbObject.instance) {
                v_adsbObject.instance = new v_adsbObject();
            }
            return v_adsbObject.instance;
        }

        parseData (_data,_droneAlt)
        {
            const now = Date.now();
            
            const len = _data.acList.length;
            for (let i=0;i<len;++i)
            {
                _data.acList[i].m_lastActiveTime = now;
                if (this.adsbObjectList.hasOwnProperty(_data.acList[i].Id))
                {
                    this.adsbObjectList[_data.acList[i].Id].update(_data.acList[i]);
                }
                else
                {
                    let _obj = new v_adsbObject ();
                    _obj.update(_data.acList[i]);
                    this.adsbObjectList[_data.acList[i].Id] = _obj;
                }
            }
        }

        
        
        fn_changeDefaultLocation (lat,lng,radius)
        {
            this.lng = lng;
            this.lat = lat;
            this.radius = radius;
        }

        fn_getADSBDataForUnit (p_andruavUnit)
        {
            if (js_globals.v_EnableADSB === false) return ;

            const now = Date.now();
            if (this.__callsTimeTable.hasOwnProperty (p_andruavUnit.partyID) === false)
            {
                this.__callsTimeTable[p_andruavUnit.partyID] = now;
            }

            if ((now - this.__callsTimeTable[p_andruavUnit.partyID] ) > this.ADSB_DroneRefreshRate)
            {
                this.fn_getADSBData (p_andruavUnit.m_Nav_Info.p_Location.lat,p_andruavUnit.m_Nav_Info.p_Location.lng,p_andruavUnit.m_Nav_Info.p_Location.alt_relative,10);
            }
        }

        fn_getADSBData (p_lat,p_lng,p_alt,p_radius)
        {
          
            if (js_globals.v_EnableADSB === false) return ;
            
            const _v_url =  this.v_url + 'lat=' + p_lat.toString() + '&lng=' + p_lng.toString() + '&fDstL=0&fDstU=' + p_radius.toString();
            js_common.fn_console_log ("ADSB URL: %s", _v_url);
            let res=null;
            const me = this;
			$.ajax({
				url: _v_url,
                type: 'GET',
                crossDomain: true,
                dataType: 'JSONP',
                
				success: function(p_res) {
                    this.parseData (p_res,p_alt);
                    js_eventEmitter.fn_dispatch(js_globals.EE_adsbExchangeReady,v_adsbObject.getInstance());
                },
                error: function ( jqXHR, textStatus, errorThrown)
				{
                    Me.v_logined = false;
                },
                async: false
			});
			
        };

        fn_onPreferenceChanged (p_caller,p_params)
        {
            if (js_globals.v_EnableADSB === false)
            {
                js_eventEmitter.fn_dispatch(js_globals.EE_adsbExchangeReady,js_eventEmitter.adsbObjectList);
            }
        }
        
        
    };

