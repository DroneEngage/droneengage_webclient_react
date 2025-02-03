import { js_globals } from "./js_globals.js";

import * as js_siteConfig from "./js_siteConfig";
import * as js_common from './js_common.js'

class CTalk {
  constructor(number, targetVideoTrack, cAndruavStream) {
    this.PeerConnection =
      window.RTCPeerConnection || window.mozRTCPeerConnection || window.webkitRTCPeerConnection;

    this.closed = false;
    this.received = false;
    this.number = number;
    this.status = "";
    this.started = +new Date();
    this.videoRecording = false;
    this.parent = cAndruavStream;
    this.onError = function () {};
    this.onConnect = function () {};
    this.onDisplayVideo = function () {};
    this.onAddStream = function () {};
    this.onRemovestream = function () {};
    this.onClosing = function () {};
    this.onDisconnected = function () {};

    this.targetVideoTrack = targetVideoTrack;

    this.pc = new this.PeerConnection(cAndruavStream.rtcconfig);
    this.pc.onicecandidate = this.onicecandidate;
    this.pc.number = number;
    this.pc.talk = this;
  }

  fn_set_status(p_status) {
    this.status = p_status;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // On ICE Route Candidate Discovery
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  onicecandidate(event) {
    if (!event.candidate) {
      return;
    }
    const talk = this.talk;
    talk.parent.transmit(talk.number, talk.targetVideoTrack, event.candidate);
  }

  // Disconnect and Hangup
  hangup(p_sendToParty) {
    if (this.closed) return;
    this.fn_set_status("closing");
    if (p_sendToParty === true) {
      this.parent.transmit(this.number, this.targetVideoTrack, {
        hangup: true,
      });
    }

    this.parent.close_conversation(this.targetVideoTrack);
  }
}
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// WebRTC Simple Calling API + Mobile
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
class AndruavStream {
  constructor() {
    this.conversations = {};

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // RTC Peer Connection Session (one per call)
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    this.PeerConnection =
      window.RTCPeerConnection || window.mozRTCPeerConnection;
    // || // https://stackoverflow.com/questions/53251527/webrtc-video-is-not-displaying
    // window.webkitRTCPeerConnection;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // ICE (many route options per call)
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    this.IceCandidate = window.RTCIceCandidate || window.mozRTCIceCandidate;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // Media Session Description (offer and answer per call)
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    this.SessionDescription =
      window.RTCSessionDescription || window.mozRTCSessionDescription;
    // ||  window.webkitRTCSessionDescription;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // STUN Server List Configuration (public STUN list)
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    this.rtcconfig = {
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

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // PHONE Events
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  }

  static getInstance() {
    // Check if the instance is null, and create a new one if it is
    if (!AndruavStream.instance) {
      AndruavStream.instance = new AndruavStream();
    }
    return AndruavStream.instance;
  }

  onOrphanDisconnect() {}

  debugerr(msg) {
    js_common.fn_console_log("webrtc ERROR: %s", msg);
  }

  debugcb(msg) {
    js_common.fn_console_log("webrtc: %s", JSON.stringify(msg));
    return;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Add/Get Conversation - Creates a new PC or Returns Existing PC
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  get_conversation(p_number, p_targetVideoTrack) {
    if (p_targetVideoTrack === null || p_targetVideoTrack === undefined) {
      p_targetVideoTrack = "default";
    }
    const v_talk = new CTalk(p_number, p_targetVideoTrack, this);

    v_talk.fn_set_status("connecting");
    // Return Brand New Talk Reference
    this.conversations[v_talk.targetVideoTrack] = v_talk;
    return v_talk;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Remove Conversation
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  close_conversation(talkId) {
    if (this.conversations[talkId] === null || this.conversations[talkId] === undefined) return;
    const talk = this.conversations[talkId];
    talk.closed = true;
    talk.onDisconnected(talk);
    talk.pc.close();
    talk.fn_set_status("closed");

    this.conversations[talkId] = undefined;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Visually Display New Stream
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  onaddtrack(talk, mediaStreamEvent) {
    const stream = mediaStreamEvent.streams[0];
    js_common.fn_console_log(
      "WEBRTC: TRACK-muted:" + stream.getVideoTracks()[0].muted
    );

    const targetVideoTrack = talk.targetVideoTrack
      .replace(/ /g, "_")
      .toLowerCase();
      const len = stream.getVideoTracks().length;
      const p = [];

    if (window.chrome === true) {
      // Multiple tracks per stream can be implemented in Chrome.
      // As in FireFox TrackID & Label are overwritten by new values so I cannot track them.
      // A proposed solution is in this link https://stackoverflow.com/questions/65408744/in-webrtc-how-do-i-label-a-local-mediastream-so-that-a-remote-peer-can-identify
      // which is to add extra data in the communication packet next to the offer.
      for (let i = 0; i < len; ++i) {
        if (stream.getVideoTracks()[i].id.toLowerCase() !== targetVideoTrack) {
          p.push(stream.getVideoTracks()[i].id);
        }
      }

      // remove tracks that are not equal to target track.
      for (let i = 0; i < p.length; ++i) {
        stream.removeTrack(stream.getTrackById(p[i]));
      }
    }

    talk.stream = stream;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Ask to Join a Broadcast
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  pv_join(dialconfig) {
    let me = this;
    let talk = this.get_conversation(
      dialconfig.number,
      dialconfig.targetVideoTrack
    );
    // Ignore if Closed

    talk.onError =
      dialconfig.onError != null ? dialconfig.onError : talk.onError;
    talk.onConnect =
      dialconfig.onConnect != null ? dialconfig.onConnect : talk.onConnect;
    talk.onDisplayVideo =
      dialconfig.onDisplayVideo != null
        ? dialconfig.onDisplayVideo
        : talk.onDisplayVideo;
    talk.onClosing =
      dialconfig.onClosing != null ? dialconfig.onClosing : talk.onClosing;
    talk.onDisconnected =
      dialconfig.onDisconnected != null
        ? dialconfig.onDisconnected
        : talk.onDisconnected;
    talk.onOrphanDisconnect =
      dialconfig.onOrphanDisconnect != null
        ? dialconfig.onOrphanDisconnect
        : talk.onOrphanDisconnect;
    talk.pc.onremovestream =
      dialconfig.onRemovestream != null
        ? dialconfig.onRemovestream
        : talk.onRemovestream;
    talk.pc.ontrack = function (mediaStreamEvent) {
      talk.onConnect(talk);
      me.onaddtrack(talk, mediaStreamEvent);
      talk.onDisplayVideo(talk);
    };
    if (talk.closed) return;
    this.transmit(dialconfig.number, dialconfig.targetVideoTrack, {
      joinme: true,
    });
  }

  joinStream(dialconfig) {
    js_globals.v_andruavClient.EVT_andruavSignalling =
      this.EVT_andruavSignalling;

    let talk;
    let vid = dialconfig.number;
    if (dialconfig.targetVideoTrack !== null && dialconfig.targetVideoTrack !== undefined) {
      vid = dialconfig.targetVideoTrack;
    }
    if (this.conversations[vid] !== null && this.conversations[vid] !== undefined) {
      talk = this.conversations[vid];
      if (talk.status === "connecting") {
        // this could be a faulty connection hat didnt start
        talk.fn_set_status("cancelled");
        this.conversations[talk.targetVideoTrack] = undefined;
        this.pv_join(dialconfig);
      }
    } else {
      this.pv_join(dialconfig);
    }

    return talk;
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Send SDP Call Offers/Answers and ICE Candidates to Peer
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  transmit(phone, channel, packet, times, time) {
    if (!packet) return;
    js_common.fn_console_log("WEBRTC:" + JSON.stringify(packet));
    const message = {
      packet: packet,
      channel: channel,
      id: phone,
      number: js_globals.v_andruavClient.partyID,
    };

    js_globals.v_andruavClient.API_WebRTC_Signalling(phone, message);
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // SDP Offers & ICE Candidates Receivable Processing
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  EVT_andruavSignalling(andruavUnit, p_signal) {
    js_common.fn_console_log("WEBRTC to WEB:" + JSON.stringify(p_signal));

    const me = AndruavStream.getInstance();

    me.debugcb(p_signal);

    // Get Call Reference
    const talk = me.conversations[p_signal.channel];

    if (!talk || talk.closed) return;

    // If Hangup Request
    if (p_signal.packet.hangup) return talk.hangup(false);

    // If Peer Calling Inbound (Incoming) - Can determine stream + receive here.
    if (p_signal.packet.sdp && !talk.received) {
      talk.received = true;
    }

    // Update Peer Connection with SDP Offer or ICE Routes
    if (p_signal.packet.sdp) {
      me.add_sdp_offer(p_signal);
    } else {
      me.add_ice_route(p_signal);
    }
  }

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Add SDP Offer/Answers
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  async add_sdp_offer(p_signal) {
    // Get Call Reference
    const talk = this.conversations[p_signal.channel];
    const pc = talk.pc;
    const type = p_signal.packet.type === "offer" ? "offer" : "answer";

    // Deduplicate SDP Offerings/Answers
    //if (type in talk) return;
    talk[type] = true;
    talk.dialed = true;

    // Notify of Call Status
    talk.fn_set_status("routing");

    try {
      await pc.setRemoteDescription(
        new this.SessionDescription(p_signal.packet)
      );
      // Set Connected Status
      talk.fn_set_status("connected");
      await this.create_answer(pc, talk);
    } catch (e) {
      js_common.fn_console_log(e);
    }
  }

  async create_answer(pc, p_talk) {
    try {
      const c_answer = await pc.createAnswer();
      await pc.setLocalDescription(c_answer);
      this.transmit(p_talk.number, p_talk.targetVideoTrack, c_answer, 2);
    } catch (e) {
      this.debugcb(e);
    }
  }
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // Add ICE Candidate Routes
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  async add_ice_route(p_signal) {
    try {
      // Leave if Non-good ICE Packet
      if (!p_signal.packet) return;
      if (!p_signal.packet.candidate) return;

      // Get Call Reference
      const talk = this.conversations[p_signal.channel];
      const pc = talk.pc;

      // Add ICE Candidate Routes
      await pc.addIceCandidate(new this.IceCandidate(p_signal.packet));
    } catch (e) {
      this.debugcb(e);
    }
  }
}

export var js_webrtcstream = AndruavStream.getInstance();
