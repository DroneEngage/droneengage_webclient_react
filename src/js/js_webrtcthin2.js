import { js_globals } from "./js_globals.js";
import {EVENTS as js_event} from './js_eventList.js'
import {js_eventEmitter} from './js_eventEmitter';
import * as js_siteConfig from "./js_siteConfig";
import * as js_common from './js_common.js';

const SEC_1 = 1000;
    
/**
 * Represents a single WebRTC conversation (peer connection).
 */
class CTalk {
  constructor(number, targetVideoTrack, cAndruavStream) {
    this.PeerConnection = window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

    this.isClosed = false;
    this.hasReceivedSdp = false; // Indicates if SDP has been received
    this.number = number; // The peer's ID/number
    this.targetVideoTrack = targetVideoTrack; // The specific video track ID for this conversation
    this.status = "initializing";
    this.startedAt = +new Date();
    this.videoRecording = false; // Not used in provided methods, kept for completeness
    this.parentStream = cAndruavStream; // Reference to the parent AndruavStream instance

    // New properties for frame rate monitoring
    this.m_actualFrameRate = 0; // Stores the latest measured frame rate
    this.frameRateMonitorInterval = null; // Holds the setInterval ID

    // Callback functions, initialized to no-op functions
    this.onError = () => {};
    this.onConnect = () => {};
    this.onDisplayVideo = () => {};
    this.onAddStream = () => {}; // Currently unused in provided methods
    this.onRemoveStream = () => {};
    this.onClosing = () => {};
    this.onDisconnected = () => {};
    
    

    // Initialize RTCPeerConnection
    this.pc = new this.PeerConnection(cAndruavStream.rtcConfig);
    this.pc.onicecandidate = this._handleIceCandidate.bind(this); // Bind 'this' to the class instance
    this.pc.number = number; // Store number on pc for easy access in callbacks if needed
    this.pc.talk = this; // Self-reference for convenience in pc callbacks
  }

  /**
   * Updates the status of the conversation.
   * @param {string} newStatus - The new status string.
   */
  setStatus(newStatus) {
    this.status = newStatus;
  }

  /**
   * Handles ICE candidate discovery and transmits it to the peer.
   * @param {RTCPeerConnectionIceEvent} event - The ICE candidate event.
   */
  _handleIceCandidate(event) {
    if (!event.candidate) {
      return;
    }
    this.parentStream.transmit(this.number, this.targetVideoTrack, event.candidate);
  }

  /**
   * Disconnects and hangs up the current conversation.
   * @param {boolean} sendToParty - True if a hangup signal should be sent to the remote party.
   */
  hangup(sendToParty) {
    if (this.isClosed) return;

    this.setStatus("closing");
    if (sendToParty) {
      this.parentStream.transmit(this.number, this.targetVideoTrack, {
        hangup: true
      });
    }

    this._stopFrameRateMonitoring(); // Stop monitoring when hanging up
    this.parentStream.closeConversation(this.targetVideoTrack);
  }

  /**
   * Starts periodic monitoring of the video stream's actual frame rate.
   */
  _startFrameRateMonitoring() {
    if (this.frameRateMonitorInterval) {
      return; // Already monitoring
    }
    js_common.fn_console_log(`WEBRTC: Starting frame rate monitoring for ${this.targetVideoTrack}`);
    // Check every second for frame rate updates
    this.frameRateMonitorInterval = setInterval(this._updateFrameRate.bind(this), SEC_1);
  }

  /**
   * Stops the frame rate monitoring.
   */
  _stopFrameRateMonitoring() {
    if (this.frameRateMonitorInterval) {
      js_common.fn_console_log(`WEBRTC: Stopping frame rate monitoring for ${this.targetVideoTrack}`);
      clearInterval(this.frameRateMonitorInterval);
      this.frameRateMonitorInterval = null;
      this.m_actualFrameRate = 0; // Reset frame rate
    }
  }

  /**
   * Fetches WebRTC statistics and updates the actual frame rate.
   */
  async _updateFrameRate() {
    if (!this.pc || this.isClosed) {
      this._stopFrameRateMonitoring();
      return;
    }

    try {
      const stats = await this.pc.getStats();
      let currentFrameRate = 0;
      let trackIdentifier = '';
      stats.forEach(report => {
        // For received video, look for 'inbound-rtp' statistics
        if (report.type === 'inbound-rtp' && report.kind === 'video') {
          // 'framesPerSecond' is commonly available in modern browsers
          if (report.bytesReceived !== undefined)
          {
            this.m_bytesReceived = report.bytesReceived;
          }
          if (report.trackIdentifier !== undefined)
          {
            trackIdentifier = report.trackIdentifier;
          }
          if (report.framesPerSecond !== undefined) {
            currentFrameRate = report.framesPerSecond;
          } else if (report.framesDecoded !== undefined && this._lastFramesDecoded !== undefined && this._lastTimestamp !== undefined) {
            currentFrameRate = 0;
          }
          this._lastFramesDecoded = report.framesDecoded;
          this._lastTimestamp = report.timestamp;
        }
        // If sending video, you might look for 'outbound-rtp'
      });
      
      

      this.m_actualFrameRate = currentFrameRate;
      js_common.fn_console_log(`WEBRTC: ${this.targetVideoTrack} Frame Rate: ${this.m_actualFrameRate.toFixed(2)} FPS`);
      const v_andruavUnit = js_globals.m_andruavUnitList.fn_getUnit(this.number);
      v_andruavUnit.m_Video.m_total_transfer_bytes += this.m_bytesReceived;
			js_eventEmitter.fn_dispatch (js_event.EE_onWebRTC_Video_Statistics,{'unit': v_andruavUnit, 'fps': currentFrameRate, 'rx':this.m_bytesReceived , 'track_id': trackIdentifier}); 
        

    } catch (e) {
      this.parentStream.debugError(`Error getting stats for ${this.targetVideoTrack}: ${e.message}`);
      this._stopFrameRateMonitoring(); // Stop monitoring on error
    }
  }
}

/**
 * Manages WebRTC streams and conversations.
 * Implements a Singleton pattern.
 */
class AndruavStream {
  static instance = null; // Static property to hold the singleton instance

  constructor() {
    if (AndruavStream.instance) {
      return AndruavStream.instance;
    }

    this.conversations = {};

    this.IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;
    this.SessionDescription = window.RTCSessionDescription || window.mozRTCSessionDescription;

    this.rtcConfig = {
      constraints: {
        mandatory: {
          OfferToReceiveAudio: false,
          OfferToReceiveVideo: true,
          codec: {
            // mimeType: 'video/H264' // or 'video/VP8', 'video/VP9'
          }
        },
        optional: [],
      },
      sdpSemantics: "unified-plan",
      iceServers: js_siteConfig.CONST_ICE_SERVERS,
    };

    // Ensure the singleton instance is set
    AndruavStream.instance = this;
  }

  /**
   * Returns the singleton instance of AndruavStream.
   * @returns {AndruavStream} The singleton instance.
   */
  static getInstance() {
    return AndruavStream.instance || new AndruavStream();
  }

  onOrphanDisconnect() {
    // Placeholder for future implementation
  }

  /**
   * Logs a WebRTC error message.
   * @param {string} msg - The error message.
   */
  debugError(msg) {
    js_common.fn_console_log("WebRTC ERROR: %s", msg);
  }

  /**
   * Logs a WebRTC callback message.
   * @param {any} msg - The message to log.
   */
  debugCallback(msg) {
    js_common.fn_console_log("WebRTC: %s", JSON.stringify(msg));
  }

  /**
   * Gets an existing conversation or creates a new one.
   * @param {string} number - The peer's number (used in signalling messages).
   * @param {string} targetVideoTrack - The ID representing the target video track.
   * @returns {CTalk} The CTalk instance for the conversation.
   */
  getConversation(number, targetVideoTrack = "default") {
    // Original logic: use targetVideoTrack as the key for conversations
    let talk = this.conversations[targetVideoTrack];
    if (!talk) {
      talk = new CTalk(number, targetVideoTrack, this);
      talk.setStatus("connecting");
      this.conversations[targetVideoTrack] = talk;
    }
    return talk;
  }

  /**
   * Closes and removes a conversation.
   * @param {string} talkId - The ID of the conversation to close (which is targetVideoTrack).
   */
  closeConversation(talkId) {
    const talk = this.conversations[talkId];
    if (!talk) return;

    talk.isClosed = true;
    talk.onDisconnected(talk);
    talk.pc.close();
    talk.setStatus("closed");

    delete this.conversations[talkId]; // Use delete to remove the property
  }

  /**
   * Handles adding a new media track to a conversation.
   * @param {CTalk} talk - The CTalk instance.
   * @param {MediaStreamTrackEvent} mediaStreamEvent - The media stream track event.
   */
  onAddTrack(talk, mediaStreamEvent) {
    const stream = mediaStreamEvent.streams[0];
    js_common.fn_console_log(`WEBRTC: TRACK-muted: ${stream.getVideoTracks()[0]?.muted}`);

    const targetTrackIdNormalized = talk.targetVideoTrack.replace(/ /g, "_").toLowerCase();

    // Chrome specific logic to filter tracks based on ID
    if (window.chrome) {
      const tracksToRemove = stream.getVideoTracks().filter(track =>
        track.id.toLowerCase() !== targetTrackIdNormalized
      );
      tracksToRemove.forEach(track => stream.removeTrack(track));
    }

    talk.stream = stream;
    talk.onDisplayVideo(talk);

    // --- NEW: Start monitoring frame rate after stream is displayed ---
    talk._startFrameRateMonitoring();
    // -----------------------------------------------------------------
  }

  /**
   * Initiates joining a stream/conversation.
   * @param {object} dialConfig - Configuration for the call.
   * @param {string} dialConfig.number - The peer's number.
   * @param {string} [dialConfig.targetVideoTrack] - The target video track ID.
   * @param {function} [dialConfig.onError] - Error callback.
   * @param {function} [dialConfig.onConnect] - Connect callback.
   * @param {function} [dialConfig.onDisplayVideo] - Display video callback.
   * @param {function} [dialConfig.onClosing] - Closing callback.
   * @param {function} [dialConfig.onDisconnected] - Disconnected callback.
   * @param {function} [dialConfig.onOrphanDisconnect] - Orphan disconnect callback.
   * @param {function} [dialConfig.onRemovestream] - Remove stream callback.
   * @param {function} [dialConfig.onFrameRateUpdate] - Callback for frame rate updates.
   * @returns {CTalk} The CTalk instance for the initiated call.
   */
  joinStream(dialConfig) {
    js_globals.v_andruavClient.EVT_andruavSignalling = this.EVT_andruavSignalling.bind(this);

    const conversationKey = dialConfig.targetVideoTrack ?? dialConfig.number;
    let talk = this.conversations[conversationKey];

    if (talk && talk.status === "connecting") {
      talk.setStatus("cancelled");
      delete this.conversations[conversationKey];
      talk = null;
    }

    if (!talk) {
      talk = this.getConversation(dialConfig.number, dialConfig.targetVideoTrack);

      talk.onError = dialConfig.onError ?? talk.onError;
      talk.onConnect = dialConfig.onConnect ?? talk.onConnect;
      talk.onDisplayVideo = dialConfig.onDisplayVideo ?? talk.onDisplayVideo;
      talk.onClosing = dialConfig.onClosing ?? talk.onClosing;
      talk.onDisconnected = dialConfig.onDisconnected ?? talk.onDisconnected;
      talk.onOrphanDisconnect = dialConfig.onOrphanDisconnect ?? talk.onOrphanDisconnect;
      talk.onRemoveStream = dialConfig.onRemovestream ?? talk.onRemoveStream;
      

      talk.pc.onremovestream = talk.onRemoveStream;
      talk.pc.ontrack = (mediaStreamEvent) => {
        talk.onConnect(talk);
        this.onAddTrack(talk, mediaStreamEvent);
      };

      if (!talk.isClosed) {
        this.transmit(dialConfig.number, dialConfig.targetVideoTrack, { joinme: true });
      }
    }

    return talk;
  }

  /**
   * Send SDP Call Offers/Answers and ICE Candidates to Peer.
   * @param {string} phone - The destination phone number.
   * @param {string} channel - The conversation channel (which is targetVideoTrack).
   * @param {object} packet - The SDP or ICE candidate packet.
   */
  transmit(phone, channel, packet) {
    if (!packet) return;
    js_common.fn_console_log(`WEBRTC: ${JSON.stringify(packet)}`);

    const message = {
      packet: packet,
      channel: channel,
      id: phone,
      number: js_globals.v_andruavWS.partyID,
    };

    js_globals.v_andruavFacade.API_WebRTC_Signalling(phone, message);
  }

  /**
   * Handles incoming WebRTC signalling messages (SDP offers/answers, ICE candidates, hangup).
   * This method must be bound to the AndruavStream instance when assigned as a callback.
   * @param {object} andruavUnit - Information about the sending unit.
   * @param {object} p_signal - The signalling packet.
   */
  async EVT_andruavSignalling(andruavUnit, p_signal) {
    js_common.fn_console_log(`WEBRTC to WEB: ${JSON.stringify(p_signal)}`);

    this.debugCallback(p_signal);

    const talk = this.conversations[p_signal.channel];

    if (!talk || talk.isClosed) return;

    if (p_signal.packet.hangup) {
      return talk.hangup(false);
    }

    if (p_signal.packet.sdp && !talk.hasReceivedSdp) {
      talk.hasReceivedSdp = true;
    }

    if (p_signal.packet.sdp) {
      await this.addSdpOffer(p_signal);
    } else {
      await this.addIceRoute(p_signal);
    }
  }

  /**
   * Adds an SDP offer or answer to the peer connection.
   * @param {object} p_signal - The signalling packet containing SDP.
   */
  async addSdpOffer(p_signal) {
    const talk = this.conversations[p_signal.channel];
    if (!talk) return;

    const pc = talk.pc;
    const sdpType = p_signal.packet.type;

    if (talk[sdpType]) return;
    talk[sdpType] = true;
    talk.dialed = true;

    talk.setStatus("routing");

    try {
      await pc.setRemoteDescription(new this.SessionDescription(p_signal.packet));
      talk.setStatus("connected");
      if (sdpType === "offer") {
        await this.createAnswer(pc, talk);
      }
    } catch (e) {
      this.debugError(e);
      talk.onError(talk, e);
    }
  }

  /**
   * Creates and sends an SDP answer.
   * @param {RTCPeerConnection} pc - The RTCPeerConnection instance.
   * @param {CTalk} talk - The CTalk instance.
   */
  async createAnswer(pc, talk) {
    try {
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      this.transmit(talk.number, talk.targetVideoTrack, answer);
    } catch (e) {
      this.debugError(e);
      talk.onError(talk, e);
    }
  }

  /**
   * Adds an ICE candidate to the peer connection.
   * @param {object} p_signal - The signalling packet containing the ICE candidate.
   */
  async addIceRoute(p_signal) {
    try {
      if (!p_signal.packet?.candidate) return;

      const talk = this.conversations[p_signal.channel];
      if (!talk) return;

      const pc = talk.pc;
      await pc.addIceCandidate(new this.IceCandidate(p_signal.packet));
    } catch (e) {
      this.debugError(e);
    }
  }
}

export var js_webrtcstream = AndruavStream.getInstance();