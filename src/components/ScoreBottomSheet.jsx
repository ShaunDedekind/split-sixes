import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export default function ScoreBottomSheet({ isOpen, onClose, player, currentScore, onSelectScore }) {
  const scores = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="bottom-sheet-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="bottom-sheet"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="bs-header">
              <h3 className="bs-title">{player?.name}'s Score</h3>
              <button className="btn-icon" onClick={onClose}><X size={24} /></button>
            </div>
            
            <div className="numpad-grid">
              {scores.map(s => (
                <button
                  key={s}
                  className={`numpad-btn ${currentScore === s ? 'selected' : ''}`}
                  onClick={() => { onSelectScore(s); onClose(); }}
                >
                  {s}
                </button>
              ))}
              <button 
                className="numpad-btn action"
                style={{ gridColumn: 'span 2' }}
                onClick={() => { onSelectScore(''); onClose(); }}
              >
                Clear Score
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
