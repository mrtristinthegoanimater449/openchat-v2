import React from 'react';
import { motion } from 'motion/react';
import { useDiscord } from '../../context/DiscordContext';
import { X, ExternalLink, Download } from 'lucide-react';

export const LightboxModal: React.FC = () => {
  const { activeLightboxImage, setActiveLightboxImage } = useDiscord();

  if (!activeLightboxImage) return null;

  return (
    <motion.div
      onClick={() => setActiveLightboxImage(null)}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.18 }}
      className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 backdrop-blur-md"
    >
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <a
          href={activeLightboxImage}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Open Original"
        >
          <ExternalLink className="w-5 h-5" />
        </a>
        <button
          onClick={() => setActiveLightboxImage(null)}
          className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          title="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div
        onClick={(e) => e.stopPropagation()}
        className="max-w-4xl max-h-[85vh] flex items-center justify-center overflow-hidden rounded-lg shadow-2xl"
      >
        <img
          src={activeLightboxImage}
          alt="Attachment"
          className="max-h-[85vh] max-w-full object-contain rounded-lg"
        />
      </div>
    </motion.div>
  );
};
