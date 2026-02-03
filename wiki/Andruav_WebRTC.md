`js_webrtcstream` is a singleton instance managing WebRTC peer connections for video streaming in the Andruav web client.  
It enables real-time video communication between drones and web clients using WebRTC signaling over a WebSocket-based protocol.

---

### Definition

`js_webrtcstream` is a module-scoped variable exported from `js_webrtcthin2.js`, initialized as the singleton instance of the `AndruavStream` class. It serves as the central interface for initiating and handling WebRTC video streams between the web client and remote devices (e.g., drones).

```javascript
449:449:./src/js/js_webrtcthin2.js
export const js_webrtcstream = AndruavStream.getInstance();
```

- **Type**: `AndruavStream` (singleton instance)
- **Scope**: Module-level export from `js_webrtcthin2.js`
- **Initialization**: Uses the `getInstance()` static method to ensure only one instance exists
- **Purpose**: Coordinates WebRTC signaling, peer connection lifecycle, and stream negotiation

The `AndruavStream` class encapsulates:
- Signaling message handling (`EVT_andruavSignalling`)
- SDP offer/answer exchange (`addSdpOffer`, `createAnswer`)
- ICE candidate processing (`addIceRoute`)
- Peer connection state management via `CTalk` instances

It acts as a bridge between the application’s signaling layer (via `js_andruav_ws`) and the WebRTC peer connection API.

---

### Example Usages

In `js_main.js`, `js_webrtcstream` is used to initiate a WebRTC video stream session when logging into a remote drone video channel.

```javascript
599:613:./src/js/js_main.js
function fn_WEBRTC_login(v_partyID, v_trackID) {
	js_webrtcstream.onOrphanDisconnect = onWEBRTCSessionOrphanEnded;

	js_webrtcstream.joinStream(
		{
			'number': v_partyID,
			'targetVideoTrack': v_trackID,
			'v_andruavClient': js_globals.v_andruavClient,
			onDisplayVideo: onWEBRTCSessionStarted,
			onError: function (v_talk, v_errormsg) { js_speak.fn_speak(v_errormsg); },
			onRemovestream: function () {
				// Handle stream removal
			},
			onDisconnected: onWEBRTCSessionEnded,
		}
	);
}
```

This usage demonstrates:
- Connecting to a specific party (`v_partyID`) and video track (`v_trackID`)
- Setting up event callbacks for stream start, errors, disconnection
- Assigning a handler for orphaned sessions

**Usage Summary**:
- Defined once in `js_webrtcthin2.js`
- Imported and used in `js_main.js` to control WebRTC login and stream lifecycle
- No other direct references found — usage appears centralized in UI-initiated streaming

---

### Notes

- `js_webrtcstream` relies on `AndruavStream.getInstance()` to enforce a singleton pattern, ensuring consistent state across the app.
- It does not directly handle media capture or rendering; instead, it delegates stream display to the `onDisplayVideo` callback (`onWEBRTCSessionStarted`).
- The signaling protocol is custom and routed through `js_globals.v_andruavFacade.API_WebRTC_Signalling`, which sends messages via a WebSocket (`js_andruav_ws`).

---

### See Also

- `AndruavStream`: The class behind `js_webrtcstream`; contains all WebRTC logic and peer connection management.
- `CTalk`: Represents an individual WebRTC conversation; holds `RTCPeerConnection`, state, and event handlers.
- `js_andruav_facade`: Provides high-level API methods including `API_WebRTC_Signalling`, used to send signaling packets.
- `fn_WEBRTC_login`: The primary function that uses `js_webrtcstream` to start a video session, located in `js_main.js`.