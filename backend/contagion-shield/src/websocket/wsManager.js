/**
 * WebSocket Manager - Manages the persistent connection to AVE WSS.
 * Implements reconnect logic, heartbeat, and local event distribution.
 * 
 * AVE WS message shape (verified 2026-04-14):
 * { id, jsonrpc: "2.0", result: { id, topic: "tx"|"liq", tx: {...} }, sent_time }
 * 
 * Topic routing:
 * - "tx" (from multi_tx subscription) → emit 'swap_event'
 * - "liq" (from liq subscription) → emit 'liq_event'
 */
import WebSocket from 'ws';
import EventEmitter from 'events';
import config from '../config/index.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('ws-manager');

class WsManager extends EventEmitter {
  constructor() {
    super();
    this.url = config.ave.wssUrl;
    this.apiKey = config.ave.apiKey;
    this.ws = null;
    this.subscriptions = new Map(); // key -> { method, params, id }
    this.reconnectAttempts = 0;
    this.maxReconnectDelay = 30000;
    this.isConnected = false;
    this.pingInterval = null;
    this.messageCount = 0;
  }

  /**
   * Connects to the AVE WebSocket server.
   * @returns {Promise<boolean>} Resolves with true if connection was initiated.
   */
  async connect() {
    logger.info({ url: this.url }, 'Connecting to AVE WebSocket...');
    
    return new Promise((resolve) => {
      try {
        this.ws = new WebSocket(this.url, {
          headers: { 'X-API-KEY': this.apiKey }
        });
        
        this.ws.on('open', () => {
          this._handleOpen();
          resolve(true);
        });

        this.ws.on('message', (data) => this._handleMessage(data));
        this.ws.on('close', () => this._handleClose());
        this.ws.on('error', (error) => this._handleError(error));
        
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to initiate WebSocket connection');
        this._scheduleReconnect();
        resolve(false);
      }
    });
  }

  _handleOpen() {
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.messageCount = 0;
    logger.info('WebSocket connection established');
    this.emit('connected');
    
    this._startHeartbeat();
    this._replaySubscriptions();
  }

  _handleMessage(data) {
    try {
      const message = JSON.parse(data.toString());
      this.messageCount++;
      
      // Log first few messages at INFO level for debugging
      if (this.messageCount <= 3) {
        logger.info({ 
          msgNum: this.messageCount, 
          topKeys: Object.keys(message).join(','),
          topic: message.result?.topic 
        }, 'WS message sample');
      }

      // Check for errors (subscription rejections)
      if (message.error) {
        logger.warn({ error: message.error, id: message.id }, 'WS subscription error (non-fatal)');
        return;
      }

      // Check for subscription confirmation (no result.topic)
      if (message.id && message.result && !message.result.topic && !message.result.tx) {
        logger.debug({ id: message.id }, 'Subscription confirmation received');
        return;
      }

      // Route based on result.topic
      const result = message.result;
      if (!result) {
        logger.trace({ msgKeys: Object.keys(message).join(',') }, 'Unrouted WS message (no result)');
        return;
      }

      const topic = result.topic;
      
      if (topic === 'tx') {
        // Swap/transaction event from multi_tx subscription
        this.emit('swap_event', result);
      } else if (topic === 'liq') {
        // Liquidity event from liq subscription
        this.emit('liq_event', result);
      } else if (topic === 'price') {
        this.emit('price_event', result);
      } else {
        logger.debug({ topic, resultKeys: Object.keys(result).join(',') }, 'Unknown WS topic');
      }

    } catch (error) {
      logger.error({ error: error.message }, 'Error parsing WS message');
    }
  }

  _handleClose() {
    this.isConnected = false;
    logger.warn({ messagesReceived: this.messageCount }, 'WebSocket connection closed');
    this.emit('disconnected');
    this._stopHeartbeat();
    this._scheduleReconnect();
  }

  _handleError(error) {
    logger.error({ error: error.message }, 'WebSocket error');
  }

  _scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts - 1), 
      this.maxReconnectDelay
    );
    
    logger.info({ delay, attempt: this.reconnectAttempts }, 'Scheduling WebSocket reconnect');
    
    setTimeout(() => {
      this.connect();
    }, delay);
  }

  _startHeartbeat() {
    this.pingInterval = setInterval(() => {
      if (this.ws && this.ws.readyState === WebSocket.OPEN) {
        this.ws.ping();
      }
    }, 20000);
  }

  _stopHeartbeat() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  /**
   * Subscribes to a specific data topic.
   * AVE WS expects: { jsonrpc: "2.0", method: "subscribe", api_key, params: [topic, address, chain], id }
   * 
   * @param {string} topic - The subscription topic ('liq', 'multi_tx', 'price')
   * @param {Array} addressAndChain - [address, chain]
   * @param {number} id - Unique subscription ID
   */
  async subscribe(topic, addressAndChain, id) {
    // Build the full params array: [topic, address, chain]
    const fullParams = [topic, ...addressAndChain];
    
    const payload = {
      jsonrpc: "2.0",
      method: "subscribe",
      api_key: this.apiKey, 
      params: fullParams,
      id: id
    };

    const subKey = `${topic}:${JSON.stringify(addressAndChain)}`;
    this.subscriptions.set(subKey, payload);

    if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
      logger.debug({ topic, address: addressAndChain[0]?.substring(0, 10), chain: addressAndChain[1] }, 
        'Sending subscription');
      this.ws.send(JSON.stringify(payload));
    }
  }

  _replaySubscriptions() {
    if (this.subscriptions.size === 0) return;
    
    logger.info({ count: this.subscriptions.size }, 'Replaying active subscriptions...');
    for (const [key, payload] of this.subscriptions) {
      this.ws.send(JSON.stringify(payload));
    }
  }

  /**
   * Returns current WebSocket connection and subscription statistics.
   */
  getStats() {
    return {
      connected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      subscriptions: this.subscriptions.size,
      messagesReceived: this.messageCount
    };
  }
}

export default new WsManager();
