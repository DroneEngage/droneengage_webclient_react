import * as js_siteConfig from '../js_siteConfig.js';

import * as js_andruav_facade from '../server_comm/js_andruav_facade.js';

/**
 * CWebSocketBridge is a WebSocket client implementation that connects to a target port
 * and provides methods for sending and receiving messages.
 */
class CWebSocketBridge {

    /**
     * Constructor initializes the target port and sets up the WebSocket client.
     */
    constructor()
    {
        this.m_target_port = js_siteConfig.CONST_WEBSOCKET_BRIDGE_PORT;
        this.m_socket = null;
        this.m_isConnected = false;
        this.m_reconnectTimer = null;
        this.m_heartbeatTimer = null;
        this.m_heartbeatIntervalMs = 10000; // 1 per 10 sec MAVLink heartbeat
    }

    /**
     * Initializes the WebSocket client and connects to the target port.
     */
    fn_init ()
    {
        // Check if the socket is already connected or connecting
        if (this.m_socket &&
            (this.m_socket.readyState === WebSocket.OPEN ||
             this.m_socket.readyState === WebSocket.CONNECTING))
        {
            return;
        }

        // Construct the WebSocket URL
        const protocol = (window.location.protocol === 'https:') ? 'ws:' : 'ws:'; // I MADE THEM BOTH WS not WSS. ALWAYS 127.0.0.1
        const port = this.m_target_port;
        const url = protocol + '//127.0.0.1:' + port + '/';

        // Create a new WebSocket object
        this.m_socket = new WebSocket(url);
        // Ensure we receive binary data as ArrayBuffer when needed (e.g. MAVLink)
        this.m_socket.binaryType = 'arraybuffer';

        // Set up event handlers
        this.m_socket.onopen = () => {
            this.m_isConnected = true;
            this.#fn_startHeartbeat();
        };

        this.m_socket.onmessage = (event) => {
            this.receiveMessage(event.data);
        };

        this.m_socket.onerror = () => {
            // Ensure we clean up and trigger reconnect on error as well
            this.m_isConnected = false;
            this.#fn_stopHeartbeat();

            try {
                if (this.m_socket &&
                    this.m_socket.readyState !== WebSocket.CLOSING &&
                    this.m_socket.readyState !== WebSocket.CLOSED)
                {
                    this.m_socket.close();
                }
            } catch (e) {
                // ignore close errors
            }
        };

        this.m_socket.onclose = () => {
            this.m_isConnected = false;
            this.#fn_stopHeartbeat();
            this.m_socket = null;

            // Reconnect after a short delay
            if (this.m_reconnectTimer === null)
            {
                this.m_reconnectTimer = window.setTimeout(() => {
                    this.m_reconnectTimer = null;
                    this.fn_init();
                }, 3000);
            }
        };
    }

    fn_uninit()
    {
        this.m_isConnected = false;
        this.#fn_stopHeartbeat();
        this.m_reconnectTimer = null;
        this.m_socket = null;
    }

    /**
     * Sends a message over the WebSocket connection.
     * If p_message is an ArrayBuffer or a TypedArray (e.g. Int8Array for MAVLink),
     * it is sent as binary without JSON stringification. Otherwise, it is sent as text.
     * @param {string|object|ArrayBuffer|ArrayBufferView} p_message The message to send.
     */
    sendMessage(p_message)
    {
        // Check if the message is valid
        if (p_message === undefined || p_message === null)
        {
            return;
        }

        let payload;

        // Handle binary MAVLink packets (ArrayBuffer or any TypedArray)
        if (p_message instanceof ArrayBuffer)
        {
            payload = p_message;
        }
        else if (ArrayBuffer.isView(p_message)) // TypedArray: Int8Array, Uint8Array, etc.
        {
            payload = p_message.buffer;
        }
        else
        {
            // Convert the message to a string if necessary
            payload = (typeof p_message === 'string') ? p_message : JSON.stringify(p_message);
        }

        // Send the message if the socket is connected
        if (this.m_socket && this.m_socket.readyState === WebSocket.OPEN)
        {
            this.m_socket.send(payload);
        }
    }

    /**
     * Handles incoming messages from the WebSocket connection.
     * @param {string} data The received message.
     */
    receiveMessage(data)
    {
        // Log the received message
        console.log('WebSocket bridge received message:', data);
    }

    #fn_startHeartbeat()
    {
        if (this.m_heartbeatTimer !== null)
        {
            return;
        }

        this.m_heartbeatTimer = window.setInterval(() => {
            if (!this.m_isConnected || !this.m_socket || this.m_socket.readyState !== WebSocket.OPEN)
            {
                return;
            }

            try
            {
                js_andruav_facade.AndruavClientFacade.API_requestMavlinkHeartBeat();
            }
            catch (e)
            {
                // Swallow errors to avoid breaking the heartbeat loop
            }
        }, this.m_heartbeatIntervalMs);
    }

    #fn_stopHeartbeat()
    {
        if (this.m_heartbeatTimer === null)
        {
            return;
        }

        window.clearInterval(this.m_heartbeatTimer);
        this.m_heartbeatTimer = null;
    }
}

// Export the WebSocket bridge instance
export const js_websocket_bridge = new CWebSocketBridge();