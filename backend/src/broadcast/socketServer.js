/**
 * Socket.io Server + REST API - Broadcasts risk updates to dashboards.
 * Also exposes REST endpoints for initial data fetch.
 */
import { Server } from 'socket.io';
import { createServer } from 'http';
import express from 'express';
import db from '../database/phase2Db.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('broadcast/socket-server');

class ArgusSocketServer {
  constructor() {
    this.port = process.env.SOCKET_PORT || 3002;
    this.app = express();
    this.httpServer = createServer(this.app);
    this.io = new Server(this.httpServer, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    // Track latest scores for initial emission
    this.latestScores = [];

    this._setupRestApi();
    this._setupSocketHandlers();
  }

  /**
   * REST API for the dashboard to fetch data directly (initial load).
   */
  _setupRestApi() {
    this.app.use(express.json());
    
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        engine: 'risk-engine',
        uptime: process.uptime(),
        connectedClients: this.io.engine?.clientsCount || 0,
        lastScoreCount: this.latestScores.length
      });
    });

    // Latest scores
    this.app.get('/api/scores/latest', (req, res) => {
      res.json({
        timestamp: Date.now(),
        scores: this.latestScores
      });
    });

    // Score history for a specific protocol
    this.app.get('/api/scores/history/:protocolId', (req, res) => {
      const { protocolId } = req.params;
      const limit = parseInt(req.query.limit) || 100;
      
      try {
        const history = db.prepare(`
          SELECT * FROM scores 
          WHERE protocol_id = ? 
          ORDER BY computed_at DESC 
          LIMIT ?
        `).all(protocolId, limit);
        
        res.json({ protocolId, history });
      } catch (error) {
        logger.error({ error: error.message, protocolId }, 'Failed to fetch score history');
        res.status(500).json({ error: 'Internal error' });
      }
    });

    // All protocols' latest scores from DB
    this.app.get('/api/scores/all', (req, res) => {
      try {
        const scores = db.prepare(`
          SELECT s1.* FROM scores s1
          INNER JOIN (
            SELECT protocol_id, MAX(computed_at) as max_at
            FROM scores
            GROUP BY protocol_id
          ) s2 ON s1.protocol_id = s2.protocol_id AND s1.computed_at = s2.max_at
        `).all();
        
        res.json({ scores });
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to fetch all scores');
        res.status(500).json({ error: 'Internal error' });
      }
    });

    // Recent alerts
    this.app.get('/api/alerts/recent', (req, res) => {
      const limit = parseInt(req.query.limit) || 20;
      
      try {
        const alerts = db.prepare(`
          SELECT * FROM alerts 
          ORDER BY created_at DESC 
          LIMIT ?
        `).all(limit);
        
        res.json({ alerts });
      } catch (error) {
        logger.error({ error: error.message }, 'Failed to fetch alerts');
        res.status(500).json({ error: 'Internal error' });
      }
    });
  }

  _setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      logger.info({ socketId: socket.id }, 'Dashboard client connected');
      
      // Send latest scores immediately on connect
      if (this.latestScores.length > 0) {
        socket.emit('scores_updated', {
          timestamp: Date.now(),
          scores: this.latestScores
        });
        logger.debug({ socketId: socket.id }, 'Sent initial scores to new client');
      }
      
      socket.on('disconnect', () => {
        logger.info({ socketId: socket.id }, 'Dashboard client disconnected');
      });
    });
  }

  /**
   * Broadcasts the full scores update payload.
   */
  broadcastScores(scores) {
    // Cache for new connections
    this.latestScores = scores.map(s => ({
      ...s,
      computedAt: Date.now()
    }));

    const payload = {
      timestamp: Date.now(),
      scores: this.latestScores
    };
    
    this.io.emit('scores_updated', payload);
    logger.debug({ clients: this.io.engine?.clientsCount || 0 }, 'Scores broadcasted');
  }

  /**
   * Broadcasts a specific signal event.
   */
  broadcastSignal(event) {
    this.io.emit('signal_event', {
      ...event,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcasts an alert event.
   */
  broadcastAlert(alert) {
    this.io.emit('alert_event', {
      ...alert,
      timestamp: Date.now()
    });
  }

  /**
   * Starts the server.
   */
  start() {
    this.httpServer.listen(this.port, () => {
      logger.info({ port: this.port }, 'Socket.io + REST API listening');
    });
  }
}

export default new ArgusSocketServer();
