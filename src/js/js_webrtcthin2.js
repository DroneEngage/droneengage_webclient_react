import { js_globals } from "./js_globals.js";
import * as js_siteConfig from "./js_siteConfig";
import * as js_common from './js_common.js';

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
    // Transmit using this.number and this.targetVideoTrack
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
      // Transmit using this.number and this.targetVideoTrack
      this.parentStream.transmit(this.number, this.targetVideoTrack, {
        hangup: true
      });
    }

    // Close conversation using targetVideoTrack as the identifier
    this.parentStream.closeConversation(this.targetVideoTrack);
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
        },
        optional: [],
      },
      candidates: {
        turn: true,
        stun: true,
        host: false,
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
    js_common.fn_console_log(`WebRTC: TRACK-muted: ${stream.getVideoTracks()[0]?.muted}`);

    const targetTrackIdNormalized = talk.targetVideoTrack.replace(/ /g, "_").toLowerCase();

    // Chrome specific logic to filter tracks based on ID
    if (window.chrome) {
      const tracksToRemove = stream.getVideoTracks().filter(track =>
        track.id.toLowerCase() !== targetTrackIdNormalized
      );
      tracksToRemove.forEach(track => stream.removeTrack(track));
    }

    talk.stream = stream;
    // The original code had onDisplayVideo called here from ontrack,
    // so we maintain that flow.
    talk.onDisplayVideo(talk);
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
   * @returns {CTalk} The CTalk instance for the initiated call.
   */
  joinStream(dialConfig) {
    // Bind EVT_andruavSignalling to this instance to maintain context
    js_globals.v_andruavClient.EVT_andruavSignalling = this.EVT_andruavSignalling.bind(this);

    // Determine the ID for conversation lookup, favoring targetVideoTrack
    const conversationKey = dialConfig.targetVideoTrack ?? dialConfig.number;
    let talk = this.conversations[conversationKey];

    // Original logic: if in "connecting" status, reset and re-initiate
    if (talk && talk.status === "connecting") {
      talk.setStatus("cancelled");
      delete this.conversations[conversationKey];
      talk = null; // Ensure a new talk is created
    }

    if (!talk) {
      // Get or create conversation, passing both number and targetVideoTrack
      talk = this.getConversation(dialConfig.number, dialConfig.targetVideoTrack);

      // Assign callbacks, defaulting to the talk's no-op functions if not provided
      talk.onError = dialConfig.onError ?? talk.onError;
      talk.onConnect = dialConfig.onConnect ?? talk.onConnect;
      talk.onDisplayVideo = dialConfig.onDisplayVideo ?? talk.onDisplayVideo;
      talk.onClosing = dialConfig.onClosing ?? talk.onClosing;
      talk.onDisconnected = dialConfig.onDisconnected ?? talk.onDisconnected;
      talk.onOrphanDisconnect = dialConfig.onOrphanDisconnect ?? talk.onOrphanDisconnect;
      talk.onRemoveStream = dialConfig.onRemovestream ?? talk.onRemoveStream; // Corrected typo here

      talk.pc.onremovestream = talk.onRemoveStream;
      talk.pc.ontrack = (mediaStreamEvent) => {
        talk.onConnect(talk); // Call onConnect immediately when a track is received
        this.onAddTrack(talk, mediaStreamEvent); // Use instance method for processing track
      };

      if (!talk.isClosed) {
        // Transmit the joinme signal using the dialConfig's number and targetVideoTrack
        this.transmit(dialConfig.number, dialConfig.targetVideoTrack, { joinme: true });
        // Status is already set to "connecting" by getConversation if it was newly created
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
    js_common.fn_console_log(`WebRTC: ${JSON.stringify(packet)}`);

    const message = {
      packet: packet,
      channel: channel, // This is the targetVideoTrack
      id: phone, // This is the remote party's ID
      number: js_globals.v_andruavClient.partyID, // This is our ID
    };

    js_globals.v_andruavClient.API_WebRTC_Signalling(phone, message);
  }

  /**
   * Handles incoming WebRTC signalling messages (SDP offers/answers, ICE candidates, hangup).
   * This method must be bound to the AndruavStream instance when assigned as a callback.
   * @param {object} andruavUnit - Information about the sending unit.
   * @param {object} p_signal - The signalling packet.
   */
  async EVT_andruavSignalling(andruavUnit, p_signal) {
    js_common.fn_console_log(`WebRTC to Web: ${JSON.stringify(p_signal)}`);

    this.debugCallback(p_signal); // 'this' refers to AndruavStream.getInstance(); due to binding

    // Look up conversation using p_signal.channel (which is targetVideoTrack)
    const talk = this.conversations[p_signal.channel];

    if (!talk || talk.isClosed) return;

    if (p_signal.packet.hangup) {
      return talk.hangup(false); // Do not send hangup back
    }

    // Original logic for `received` flag
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
    // Look up conversation using p_signal.channel (which is targetVideoTrack)
    const talk = this.conversations[p_signal.channel];
    if (!talk) return;

    const pc = talk.pc;
    const sdpType = p_signal.packet.type;

    // Deduplicate SDP Offerings/Answers - check if already processed
    // Original logic: if ('type' in talk) return;
    if (talk[sdpType]) return;
    talk[sdpType] = true;
    talk.dialed = true; // 'dialed' flag name could be clearer

    talk.setStatus("routing");

    try {
      await pc.setRemoteDescription(new this.SessionDescription(p_signal.packet));
      talk.setStatus("connected");
      if (sdpType === "offer") {
        await this.createAnswer(pc, talk);
      }
    } catch (e) {
      this.debugError(e);
      talk.onError(talk, e); // Notify error
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
      // Transmit using talk.number and talk.targetVideoTrack
      this.transmit(talk.number, talk.targetVideoTrack, answer);
    } catch (e) {
      this.debugError(e);
      talk.onError(talk, e); // Notify error
    }
  }

  /**
   * Adds an ICE candidate to the peer connection.
   * @param {object} p_signal - The signalling packet containing the ICE candidate.
   */
  async addIceRoute(p_signal) {
    try {
      if (!p_signal.packet?.candidate) return; // Use optional chaining for safer access

      // Look up conversation using p_signal.channel (which is targetVideoTrack)
      const talk = this.conversations[p_signal.channel];
      if (!talk) return;

      const pc = talk.pc;
      await pc.addIceCandidate(new this.IceCandidate(p_signal.packet));
    } catch (e) {
      this.debugError(e);
      // Not necessarily an error that needs to stop the connection, but good to log
    }
  }
}

export var js_webrtcstream = AndruavStream.getInstance();