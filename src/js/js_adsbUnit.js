
export class CADSBObject
{
    constructor (icao_address)
	{
		this.m_icao_address = icao_address;
        this.m_emitter_type = 0;
        this.m_last_access = new Date();
	}

    
};

class CADSBObjectList
{
    constructor ()
	{
		this.List = {};
		this.count = 0;
	}


    static getInstance() {
        // Check if the instance is null, and create a new one if it is
        if (!CADSBObjectList.instance) {
            CADSBObjectList.instance = new CADSBObjectList();
        }
        return CADSBObjectList.instance;
    
    }

    Add (icao_address,adsb_object)
	{
		const key = icao_address.toString();
		this.List[key] = adsb_object;
        this.count = this.count + 1;
	};


	Del (icao_address)
	{
		const key = icao_address.toString();
		if (this.hasOwnProperty(key))
		{
			delete this.List[key];
			this.count = this.count -1;
		}
	};

    fn_getADSBObject (icao_address)
	{
        if (icao_address == null) return null;
			
        const key = icao_address.toString();
		if (this.List.hasOwnProperty(key))
		{
            return this.List[key];
		}
		return null;
	};
}


export var js_adsbUnit =  CADSBObjectList.getInstance();
