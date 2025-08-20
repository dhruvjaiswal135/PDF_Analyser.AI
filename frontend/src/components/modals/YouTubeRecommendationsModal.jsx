import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Play, Clock, Eye, Calendar, ExternalLink, Youtube, Sparkles, Video } from 'lucide-react';
import { getYouTubeRecommendations } from '../../services/api';
import toast from 'react-hot-toast';

const premiumEasing = [0.25, 0.46, 0.45, 0.94];

const YouTubeRecommendationsModal = ({ isOpen, onClose, selectedText, context = '' }) => {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen && selectedText) {
      fetchRecommendations();
    }
  }, [isOpen, selectedText]);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await getYouTubeRecommendations({
        selected_text: selectedText,
        context: context
      });
      
      setVideos(response.videos || []);
      setSearchQuery(response.search_query || '');
      
      if (response.videos?.length === 0) {
        setError('No videos found for this topic. Try selecting different text.');
      }
    } catch (err) {
      console.error('Error fetching YouTube recommendations:', err);
      setError(err.message || 'Failed to fetch YouTube recommendations');
      toast.error('Failed to load YouTube recommendations');
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (duration) => {
    if (!duration) return '';
    
    // Parse ISO 8601 duration (PT4M13S -> 4:13)
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1]) || 0;
    const minutes = parseInt(match[2]) || 0;
    const seconds = parseInt(match[3]) || 0;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const formatViewCount = (viewCount) => {
    if (!viewCount) return '';
    
    const count = parseInt(viewCount);
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M views`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K views`;
    }
    return `${count} views`;
  };

  const formatPublishedDate = (publishedAt) => {
    if (!publishedAt) return '';
    
    const date = new Date(publishedAt);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 30) return `${diffDays} days ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  const openVideo = (videoId) => {
    window.open(`https://www.youtube.com/watch?v=${videoId}`, '_blank');
  };

  const openChannel = (channelTitle) => {
    window.open(`https://www.youtube.com/results?search_query=${encodeURIComponent(channelTitle)}`, '_blank');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, ease: premiumEasing }}
          className="relative bg-white/95 backdrop-blur-2xl rounded-3xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden border border-white/30"
          style={{
            backdropFilter: 'blur(24px) saturate(180%)',
            background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(250,250,249,0.9) 100%)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,255,255,0.2)'
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative background elements */}
          <div className="absolute inset-0 opacity-5">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-[#DC2626]/30 via-transparent to-transparent rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-[#059669]/20 via-transparent to-transparent rounded-full blur-3xl" />
          </div>

          {/* Header */}
          <div className="relative bg-gradient-to-r from-[#DC2626] via-[#DC2626] to-[#B91C1C] px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <motion.div
                  className="p-3 bg-white/20 rounded-2xl backdrop-blur-sm"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 400 }}
                >
                  <Youtube className="w-7 h-7 text-white" />
                </motion.div>
                <div>
                  <motion.h2 
                    className="text-2xl font-black text-white tracking-tight"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    Video Recommendations
                  </motion.h2>
                  {searchQuery && (
                    <motion.div
                      className="flex items-center space-x-2 mt-1"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.4 }}
                    >
                      <Sparkles className="w-4 h-4 text-white/80" />
                      <p className="text-white/90 text-sm font-medium">
                        Search: "{searchQuery}"
                      </p>
                    </motion.div>
                  )}
                </div>
              </div>
              <motion.button
                onClick={onClose}
                className="p-3 hover:bg-white/20 rounded-2xl transition-all duration-300 group"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <X className="w-6 h-6 text-white group-hover:rotate-90 transition-transform duration-300" />
              </motion.button>
            </div>
          </div>

          {/* Selected Text Preview */}
          <div className="relative px-8 py-4 bg-gradient-to-r from-[#059669]/10 via-transparent to-[#DC2626]/10 border-b border-white/20">
            <motion.div
              className="flex items-start space-x-3"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
            >
              <div className="p-2 bg-[#059669]/20 rounded-xl">
                <Video className="w-4 h-4 text-[#059669]" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-[#1A1A1A] mb-1">Selected Content</p>
                <p className="text-sm text-[#1A1A1A]/70 italic leading-relaxed">
                  {selectedText.length > 200 ? `${selectedText.substring(0, 200)}...` : selectedText}
                </p>
              </div>
            </motion.div>
          </div>

          {/* Content */}
          <div className="relative flex-1 overflow-y-auto max-h-[60vh]">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  className="relative"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                    className="w-12 h-12 border-3 border-[#DC2626]/30 border-t-[#DC2626] rounded-full mb-6"
                  />
                  <motion.div
                    className="absolute inset-0 w-12 h-12 border-3 border-transparent border-b-[#059669]/50 rounded-full"
                    animate={{ rotate: -360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>
                <motion.p 
                  className="text-[#1A1A1A]/70 font-medium"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  Finding perfect videos for you...
                </motion.p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-[#DC2626]/20 to-[#DC2626]/10 rounded-3xl flex items-center justify-center mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Youtube className="w-10 h-10 text-[#DC2626]" />
                </motion.div>
                <p className="text-[#DC2626] text-center font-medium mb-4">{error}</p>
                <motion.button
                  onClick={fetchRecommendations}
                  className="px-6 py-3 bg-gradient-to-r from-[#DC2626] to-[#B91C1C] text-white rounded-2xl font-semibold hover:shadow-lg transition-all duration-300"
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                >
                  Try Again
                </motion.button>
              </div>
            ) : videos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <motion.div
                  className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-50 rounded-3xl flex items-center justify-center mb-6"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Youtube className="w-10 h-10 text-gray-400" />
                </motion.div>
                <p className="text-[#1A1A1A]/60 font-medium">No videos found for this topic</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-8">
                {videos.map((video, index) => (
                  <motion.div
                    key={video.video_id}
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ 
                      delay: index * 0.1, 
                      duration: 0.6,
                      ease: premiumEasing
                    }}
                    className="group bg-white/60 backdrop-blur-xl rounded-2xl overflow-hidden hover:shadow-2xl transition-all duration-500 border border-white/40 cursor-pointer hover:scale-[1.02]"
                    style={{
                      backdropFilter: 'blur(16px) saturate(120%)',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.8) 0%, rgba(250,250,249,0.6) 100%)'
                    }}
                    onClick={() => openVideo(video.video_id)}
                  >
                    {/* Thumbnail */}
                    <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-50 overflow-hidden">
                      <img
                        src={video.thumbnail_url}
                        alt={video.title}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500" />
                      
                      {/* Play button overlay */}
                      <motion.div 
                        className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500"
                        whileHover={{ scale: 1.1 }}
                      >
                        <div className="p-4 bg-white/90 backdrop-blur-sm rounded-full shadow-2xl">
                          <Play className="w-8 h-8 text-[#DC2626] ml-1" />
                        </div>
                      </motion.div>

                      {/* Duration badge */}
                      {video.duration && (
                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/80 backdrop-blur-sm text-white text-xs font-semibold rounded-lg">
                          {formatDuration(video.duration)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <h3 className="font-bold text-[#1A1A1A] line-clamp-2 mb-3 group-hover:text-[#DC2626] transition-colors duration-300 leading-tight">
                        {video.title}
                      </h3>
                      
                      <div className="flex items-center justify-between mb-3">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openChannel(video.channel_title);
                          }}
                          className="text-sm font-semibold text-[#059669] hover:text-[#047857] transition-colors duration-300 truncate max-w-[60%]"
                        >
                          {video.channel_title}
                        </button>
                        <motion.div
                          className="p-2 bg-[#DC2626]/10 rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-300"
                          whileHover={{ scale: 1.1 }}
                        >
                          <ExternalLink className="w-4 h-4 text-[#DC2626]" />
                        </motion.div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-[#1A1A1A]/60">
                        <div className="flex items-center space-x-4">
                          {video.view_count && (
                            <div className="flex items-center space-x-1">
                              <Eye className="w-3 h-3" />
                              <span className="font-medium">{formatViewCount(video.view_count)}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-1">
                            <Calendar className="w-3 h-3" />
                            <span className="font-medium">{formatPublishedDate(video.published_at)}</span>
                          </div>
                        </div>
                      </div>

                      {video.description && (
                        <p className="text-sm text-[#1A1A1A]/60 mt-3 line-clamp-2 leading-relaxed">
                          {video.description}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="relative px-8 py-4 bg-gradient-to-r from-white/80 to-white/60 backdrop-blur-xl border-t border-white/30">
            <div className="flex items-center justify-between">
              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <div className="p-2 bg-[#059669]/20 rounded-xl">
                  <ExternalLink className="w-4 h-4 text-[#059669]" />
                </div>
                <p className="text-sm font-medium text-[#1A1A1A]/70">
                  Click any video to watch on YouTube
                </p>
              </motion.div>
              
              <motion.div
                className="flex items-center space-x-2 px-4 py-2 bg-white/40 rounded-xl border border-white/40"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
              >
                <Youtube className="w-4 h-4 text-[#DC2626]" />
                <span className="text-sm font-semibold text-[#1A1A1A]/70">
                  {videos.length} recommendations
                </span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default YouTubeRecommendationsModal;
