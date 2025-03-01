import { js_globals } from './js_globals.js';
import { ClssAndruavMissionPlan } from './js_plan_mission.js';

/**
 * Manages and contains all ClssAndruavMissionPlan instances for all units.
 */
class ClssAndruavMissionPlanManager {
    constructor() {
        // Initialize an object to hold mission plans indexed by their IDs
        this.m_missionPlans = {};
        // Store the currently active mission plan
        this.m_activePlan = null;
        // Counter to track the number of missions created
        this.m_missionCounter = 1; 
    }

    /**
     * Singleton instance retrieval method.
     * @returns {ClssAndruavMissionPlanManager} The single instance of the manager.
     */
    static getInstance() {
        if (!ClssAndruavMissionPlanManager.instance) {
            // Create a new instance if it doesn't exist
            ClssAndruavMissionPlanManager.instance = new ClssAndruavMissionPlanManager();
        }
        return ClssAndruavMissionPlanManager.instance;
    }

    /**
     * Creates a new mission plan.
     * @returns {ClssAndruavMissionPlan} The newly created mission plan.
     */
    fn_createNewMission() {
        // Determine the initial color for the mission path from globals
        const c_initColor = js_globals.v_colorDrawPathes[this.m_missionCounter % js_globals.v_colorDrawPathes.length];
        
        // Create a new mission plan instance
        let v_missionPlan = new ClssAndruavMissionPlan(this.m_missionCounter, c_initColor);
        
        // Store the new mission plan in the manager
        this.m_missionPlans[this.m_missionCounter] = v_missionPlan;
        
        // Increment the mission counter for the next creation
        this.m_missionCounter += 1;

        return v_missionPlan;
    }

    /**
     * Deletes a mission plan by its ID.
     * @param {number} v_id2 - The ID of the mission plan to delete.
     */
    fn_deleteMission(v_id2) {
        // Check if the mission plan exists
        if (!this.m_missionPlans.hasOwnProperty(v_id2)) {
            return; // Exit if it does not exist
        }

        // Get the mission plan to delete
        let v_missionPlan = this.m_missionPlans[v_id2];
        // Call the delete method on the mission plan to clean up resources
        v_missionPlan.fn_deleteAll();
        // Remove the mission plan from the manager
        //delete this.m_missionPlans[v_id2];
    }

    /**
     * Gets the currently active mission plan.
     * @returns {ClssAndruavMissionPlan|null} The active mission plan or null if none.
     */
    fn_getCurrentMission() {
        return this.m_activePlan;
    }


    fn_activateMissionItem(p_mission_item_id, direction){
        let v_missionPlan = js_mapmission_planmanager.fn_getCurrentMission();
        if (v_missionPlan === null) return;
        return v_missionPlan.fn_activateMissionItem(p_mission_item_id, direction);
    }

    /**
     * Activates the next plan based on the provided ID.
     * @param {number} v_id2 - The ID of the current plan.
     * @returns {ClssAndruavMissionPlan|null} The next plan or null if none.
     */
    fn_activateNextMission(v_id2) {
        const c_mission_keys = Object.keys(this.m_missionPlans);
        
        // Check if there are any mission plans
        if (!c_mission_keys.length) {
            return null; // Exit if there are none
        }

        const currentIndex = c_mission_keys.indexOf(v_id2);
    
        if (currentIndex === -1) {
            return null; // v_id2 not found
        }
    
        const nextIndex = (currentIndex + 1) % c_mission_keys.length;
        const nextMissionId = c_mission_keys[nextIndex];
        const nextMission = this.m_missionPlans[nextMissionId];
    
        this.fn_setCurrentMission(nextMission.m_id);
        return nextMission;

    }

    /**
     * Sets the current active mission plan.
     * @param {number} v_id1 - The ID of the mission plan to activate.
     */
    fn_setCurrentMission(v_id1) {
        // Check if the mission plan exists
        if (!this.m_missionPlans.hasOwnProperty(v_id1)) {
            return; // Exit if it does not exist
        }
        
        // If there is an active mission plan, unhighlight it
        if (this.m_activePlan) {
            this.m_activePlan.fn_highlight(false);
        }

        // Set the new active mission plan
        this.m_activePlan = this.m_missionPlans[v_id1];
        // Highlight the new active mission plan
        this.m_activePlan.fn_highlight(true);
    }

    /**
     * Displays all markers on the provided map.
     * @param {Object} v_map1 - The map object to show markers on.
     */
    fn_showAllMarkers(v_map1) {
        // Get all mission plans and show their markers on the map
        let v_missionPlans = Object.values(this.m_missionPlans);
        v_missionPlans.forEach(x => x.fn_showMarkers(v_map1));
    }
}

// Export a singleton instance of the manager
export var js_mapmission_planmanager = ClssAndruavMissionPlanManager.getInstance();