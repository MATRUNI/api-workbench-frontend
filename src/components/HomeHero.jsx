import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Database, House, Box, Book, History, MessageSquareCodeIcon } from "lucide-react";
import { UserContext } from '../context/UserContext';
import { prismMotion, fadeFromLeft, fadeFromRight } from "../animations/Motion.js"
import '../style/HomeHero.css';

function HomeHero() {
  const navigate = useNavigate();
  const { user } = useContext(UserContext);

  return (
    <motion.div className="home-hero-prism" initial="hidden" animate="visible" {...prismMotion}>
      <div className="prism-backdrop">
        <div className="line-y"></div>
        <div className="line-x"></div>
      </div>

      <div className="prism-content">
        <div className="top-section">
          <motion.div className="status-pill" {...fadeFromLeft}>
            <House size={14} />
            SYSTEM_READY
          </motion.div>
          <motion.div className="version-info" {...fadeFromRight}>
            <Box size={14} />
            BUILD_2026.05
          </motion.div>
        </div>

        <div className="main-interaction">
          <motion.div className="hero-text-area" {...fadeFromLeft}>
            <h1 className="huge-title">API<span className="dot">.</span>OS</h1>
            <p className="tagline">DISPATCH DATA THROUGH THE VOID.</p>
          </motion.div>

          <div className={`split-nav ${user ? 'logged-in' : 'logged-out'}`}>
            <motion.div 
              className="nav-item start" 
              onClick={() => navigate('/endpoints')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="item-bg"></div>
              <div className="item-label" >
                <Terminal size={18} className="nav-icon" />
                01 / WORKBENCH
              </div>
              <h2 className="item-title">INITIALIZE_HUB</h2>
              <div className="item-desc">Open the primary testing environment.</div>
            </motion.div>

            <motion.div 
              className="nav-item docs" 
              onClick={() => navigate('/docs')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="item-bg"></div>
              <div className="item-label">
                <Book size={18} className="nav-icon" />
                02 / DOCUMENTATION
              </div>
              <h2 className="item-title">READ_DOCS</h2>
              <div className="item-desc">Access system references and guidelines.</div>
            </motion.div>

            <motion.div 
              className="nav-item console" 
              onClick={() => navigate('/console')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="item-bg"></div>
              <div className="item-label">
                <History size={18} className="nav-icon" />
                03 / HISTORY
              </div>
              <h2 className="item-title">SYSTEM_CONSOLE</h2>
              <div className="item-desc">Monitor live telemetry and output logs.</div>
            </motion.div>

            <AnimatePresence>
              {user && (
                <motion.div 
                  className="nav-item chat" 
                  onClick={() => navigate('/chat')}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="item-bg"></div>
                  <div className="item-label">
                    <MessageSquareCodeIcon size={18} className="nav-icon" />
                    04 / SECURE_LINK
                  </div>
                  <h2 className="item-title">OPEN_CHAT</h2>
                  <div className="item-desc">Establish direct encrypted comms.</div>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div 
              className="nav-item fetch" 
              onClick={() => navigate('/fetch')}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="item-bg"></div>
              <div className="item-label">
                <Database size={18} className="nav-icon" /> 
                {user ? '05 / LIBRARY' : '04 / LIBRARY'}
              </div>
              <h2 className="item-title">FETCH_SCHEMAS</h2>
              <div className="item-desc">Browse pre-configured API blueprints.</div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export default HomeHero;