const EVENT_LIST = Object.freeze({
	EVENTS: Object.freeze(
		[
			"EE_WS_OPEN",
			"EE_WS_CLOSE",
			"EE_onDeleted",
			"EE_msgFromUnit_GPS",
			"EE_msgFromUnit_IMG",
			"EE_andruavUnitAdded",
			"EE_HomePointChanged",
			"EE_DistinationPointChanged",
			"EE_andruavUnitError",
			"EE_andruavUnitGeoFenceUpdated",
			"EE_andruavUnitGeoFenceHit",
			"EE_msgFromUnit_WayPoints",
			"EE_msgFromUnit_WayPointsUpdated",
			"EE_andruavUnitArmedUpdated",
			"EE_andruavUnitGeoFenceBeforeDelete",
			"EE_andruavUnitFCBUpdated",
			"EE_andruavUnitFlyingUpdated",
			"EE_andruavUnitFightModeUpdated",
			"EE_andruavUnitVehicleTypeUpdated",
			"EE_onProxyInfoUpdated",
			"EE_onAndruavUnitSwarmUpdated",
			"EE_andruavUnitLidarInfo",
			"EE_andruavUnitLidarShow",
			"EE_onMessage",
			"EE_onModuleUpdated",
			"EE_onPreferenceChanged",
			"EE_unitAdded",
			"EE_unitUpdated",
			"EE_OldModule",
			"EE_unitHighlighted",
			"EE_unitOnlineChanged",
			"EE_unitPowUpdated",
			"EE_unitP2PUpdated",
			"EE_unitSDRUpdated",
			"EE_unitSDRSpectrum",
			"EE_unitSDRTrigger",
			"EE_unitNavUpdated",
			"EE_onSocketStatus",
			"EE_onSocketStatus2",
			"EE_onGUIMessage",
			"EE_onGUIMessageHide",
			"EE_updateLogin",
			"EE_videoStreamStarted",
			"EE_videoStreamRedraw",
			"EE_videoStreamStopped",
			"EE_unitTelemetryOn",
			"EE_unitTelemetryOff",
			"EE_BattViewToggle",
			"EE_EKFViewToggle",
			"EE_adsbExchangeReady",
			"EE_displayGeoForm",
			"EE_onShapeCreated",
			"EE_onShapeSelected",
			"EE_onMissionReset",
			"EE_onShapeEdited",
			"EE_onShapeDeleted",
			"EE_mapMissionUpdate",
			"EE_displayServoForm",
			"EE_servoOutputUpdate",
			"EE_DetectedTarget",
			"EE_SearchableTarget",

			"EE_cameraZoomChanged",
			"EE_cameraFlashChanged",

			"EE_displayParameters",
			"EE_updateParameters",

			"EE_requestGamePad",
			"EE_releaseGamePad",

			"EE_GamePad_Connected",
			"EE_GamePad_Disconnected",
			"EE_GamePad_Axes_Updated",
			"EE_GamePad_Other_Axes_Updated",
			"EE_GamePad_Button_Updated",
			"EE_GamePad_Config_Index_Changed",
			"EE_GamePad_Control_Update",


			"EE_displayStreamDlgForm",
			"EE_hideStreamDlgForm",

			"EE_displayYawDlgForm",
			"EE_displayCameraDlgForm",
			"EE_hideCameraDlgForm",

			"EE_onPlanToggle",
			"EE_onAdvancedMode",
			"EE_ErrorMessage",
			"EE_adsbExpiredUpdate",


			"EE_Auth_Login_In_Progress",
			"EE_Auth_Logined",
			"EE_Auth_BAD_Logined",
			"EE_Auth_Account_Created",
			"EE_Auth_Account_Regenerated",
			"EE_Auth_Account_BAD_Operation",

			"EE_Video_State_Change",
			"EE_unitGPIOUpdated",

			"EE_onMissionItemToggle",
			"EE_onTrackingStatusChanged",
			"EE_onTrackingAIStatusChanged",
			"EE_onTrackingAIObjectListUpdate",

			"EE_onWebRTC_Video_Statistics",

			"EE_Language_Changed"
		].reduce((acc, name, index) => {
			acc[name] = `EVT_${index + 1}`;
			return acc;
		}, {})
	)
});

export const EVENTS = EVENT_LIST.EVENTS; // Named export for EVENTS
export default EVENT_LIST;