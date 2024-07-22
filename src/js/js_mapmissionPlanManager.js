import {js_globals} from './js_globals.js';
import {ClssAndruavMissionPlan} from './js_mapmission'


class ClssAndruavMissionPlanManager 
{
	constructor ()
	{
		this.m_missionPlans = {};
		this.m_activePlan = null;
		this.m_missionCounter =1; 
	}

	static getInstance() {
        if (!ClssAndruavMissionPlanManager.instance) {
            ClssAndruavMissionPlanManager.instance = new ClssAndruavMissionPlanManager(1);
        }
        return ClssAndruavMissionPlanManager.instance;
    }

    
	fn_createNewMission ()
	{
		const c_initColor = js_globals.v_colorDrawPathes[this.m_missionCounter%js_globals.v_colorDrawPathes.length];
		var v_missionPlan = new ClssAndruavMissionPlan (this.m_missionCounter, c_initColor);
		this.m_missionPlans[this.m_missionCounter] = v_missionPlan;
		this.m_missionCounter = this.m_missionCounter + 1;

		
		return v_missionPlan;
	}

	fn_deleteMission (v_id2)
	{
		if (this.m_missionPlans.hasOwnProperty(v_id2) === false)
		{
			return ;
		}

		let v_missionPlan = this.m_missionPlans[v_id2];
		v_missionPlan.fn_deleteAll ();
		delete this.m_missionPlans[v_id2];
	}

	fn_getCurrentMission()
	{
		return this.m_activePlan;
	}


	fn_activateNextMission (v_id2)
	{
		var p_keys = Object.keys(this.m_missionPlans);
		if ((p_keys === undefined) || (p_keys ===null) || (p_keys.length ===0))
		{
			return null;
		}

		var p_len = p_keys.length;
		var p_index =0;
		
		for (var i=0;i<p_len;++i)
		{
			if (p_keys[i] === v_id2)
			{
				p_index = (i + 1) % p_keys.length;
				var v_mission = this.m_missionPlans[p_keys[p_index]];
				this.fn_setCurrentMission (v_mission.m_id);
				return v_mission;
			}
		}
		
	}

	fn_setCurrentMission (v_id1)
	{
		if (this.m_missionPlans.hasOwnProperty(v_id1) === false)
		{
			return ;
		}
		
		if (this.m_activePlan !== null && this.m_activePlan !== undefined)
		{
			// unselect the old one.
			this.m_activePlan.fn_highlight (false);
		}

		this.m_activePlan = this.m_missionPlans[v_id1];
		this.m_activePlan.fn_highlight (true);
	}


	fn_showAllMarkers (v_map1)
	{
		
		var v_missionPlans = Object.values(this.m_missionPlans);
		v_missionPlans.map(x => x.fn_showMarkers(v_map1));
		
	};

}


export var js_mapmission_planmanager = ClssAndruavMissionPlanManager.getInstance();