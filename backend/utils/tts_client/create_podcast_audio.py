import os
import uuid
import logging
from typing import List, Dict

# Set up logging
logger = logging.getLogger(__name__)

from .generate_audio import generate_audio
from .combine_text_transcripts import combine_text_transcripts


def create_podcast_audio(script: List[Dict[str, str]]) -> str:
    """
    Create a complete podcast audio from script
    Returns the path to the combined audio file
    """
    logger.info(f"🎵 Creating podcast audio from {len(script)} script segments...")
    
    audio_files_created = []
    
    # Generate individual audio files
    for i, entry in enumerate(script):
        logger.info(f"🎤 Generating audio for segment {i+1}/{len(script)}: {entry['speaker']}")
        audio_file = generate_audio(entry["text"], entry["speaker"])
        if audio_file and (audio_file.endswith('.wav') or audio_file.endswith('.txt')):
            from config import settings
            audio_path = os.path.join(settings.audio_folder, audio_file)
            if os.path.exists(audio_path):
                file_size = os.path.getsize(audio_path)
                
                # Validate audio file if it's a WAV
                if audio_file.endswith('.wav'):
                    if file_size > 44:  # WAV header is 44 bytes
                        try:
                            # Try to validate the WAV file
                            import wave
                            with wave.open(audio_path, 'r') as test_wav:
                                frames = test_wav.getnframes()
                                if frames > 0:
                                    audio_files_created.append(audio_file)
                                    logger.info(f"✅ Valid WAV created: {audio_file} ({file_size} bytes, {frames} frames)")
                                else:
                                    logger.error(f"❌ WAV file has no audio frames: {audio_file}")
                        except Exception as e:
                            logger.error(f"❌ Invalid WAV file {audio_file}: {e}")
                    else:
                        logger.error(f"❌ WAV file too small: {audio_file} ({file_size} bytes)")
                else:
                    # Text file
                    audio_files_created.append(audio_file)
                    logger.info(f"✅ Text file created: {audio_file} ({file_size} bytes)")
            else:
                logger.error(f"❌ File not found: {audio_path}")
        else:
            logger.error(f"❌ Failed to generate audio for segment {i+1}")
    
    if not audio_files_created:
        logger.error("❌ No audio files were created")
        return None
    
    # Check if all files are text transcripts
    if all(f.endswith('.txt') for f in audio_files_created):
        logger.info("📝 All files are text transcripts, combining them...")
        return combine_text_transcripts(audio_files_created)
    
    # Try to combine using pydub for audio files
    wav_files = [f for f in audio_files_created if f.endswith('.wav')]
    if wav_files:
        try:
            from pydub import AudioSegment
            from config import settings
            logger.info("🎵 Attempting to combine WAV audio using pydub...")
            
            audio_segments = []
            previous_speaker = None
            successfully_loaded = []
            
            for i, audio_file in enumerate(wav_files):
                audio_path = os.path.join(settings.audio_folder, audio_file)
                try:
                    # Try multiple audio formats for loading
                    segment = None
                    
                    # First try as WAV
                    try:
                        segment = AudioSegment.from_wav(audio_path)
                        logger.info(f"✅ Loaded WAV: {audio_file}")
                    except Exception as wav_error:
                        logger.warning(f"⚠️ Failed to load as WAV: {wav_error}")
                        
                        # Try as generic audio file
                        try:
                            segment = AudioSegment.from_file(audio_path)
                            logger.info(f"✅ Loaded as generic audio: {audio_file}")
                        except Exception as generic_error:
                            logger.error(f"❌ Failed to load as any audio format: {generic_error}")
                            continue
                    
                    if segment:
                        # Normalize audio levels
                        segment = segment.normalize()
                        
                        # Ensure consistent sample rate
                        if segment.frame_rate != 22050:
                            segment = segment.set_frame_rate(22050)
                        
                        # Ensure mono
                        if segment.channels > 1:
                            segment = segment.set_channels(1)
                        
                        audio_segments.append(segment)
                        successfully_loaded.append(audio_file)
                        
                        # Add natural pauses between segments
                        if i < len(wav_files) - 1:
                            current_speaker = script[i]['speaker'] if i < len(script) else 'unknown'
                            
                            if previous_speaker != current_speaker:
                                pause_duration = 850  # ms for speaker change
                            else:
                                pause_duration = 400  # ms for same speaker
                            
                            audio_segments.append(AudioSegment.silent(duration=pause_duration))
                            previous_speaker = current_speaker
                    
                except Exception as e:
                    logger.error(f"❌ Could not load {audio_file}: {e}")
                    continue
            
            if audio_segments:
                # Combine all segments
                logger.info(f"🎵 Combining {len(audio_segments)} audio segments...")
                combined = audio_segments[0]
                for segment in audio_segments[1:]:
                    combined += segment
                
                # Save combined audio with proper format
                output_filename = f"podcast_combined_{uuid.uuid4()}.wav"
                output_path = os.path.join(settings.audio_folder, output_filename)
                
                # Export with specific parameters for better compatibility
                combined.export(
                    output_path, 
                    format="wav",
                    parameters=[
                        "-ar", "22050",  # Sample rate
                        "-ac", "1",      # Mono
                        "-acodec", "pcm_s16le"  # 16-bit PCM
                    ]
                )
                
                logger.info(f"✅ Combined WAV audio saved: {output_filename}")
                logger.info(f"✅ Final audio duration: {len(combined)/1000:.1f} seconds")
                logger.info(f"✅ Final audio size: {os.path.getsize(output_path)} bytes")
                
                # Clean up individual files
                for audio_file in successfully_loaded:
                    try:
                        os.remove(os.path.join(settings.audio_folder, audio_file))
                        logger.info(f"🗑️ Cleaned up: {audio_file}")
                    except:
                        pass
                
                return output_filename
            else:
                logger.error("❌ No audio segments could be loaded for combining")
                
        except ImportError:
            logger.warning("⚠️ pydub not available, using custom combining method...")
        except Exception as e:
            logger.error(f"❌ pydub combining failed: {e}")
    
    # Custom combining method as fallback
    if wav_files:
        logger.info("🎵 Attempting custom WAV combining method...")
        try:
            import wave
            import struct
            
            combined_audio_data = []
            sample_rate = 22050
            combined_frames = 0
            
            for i, audio_file in enumerate(wav_files):
                audio_path = os.path.join(settings.audio_folder, audio_file)
                try:
                    with wave.open(audio_path, 'r') as wav_file:
                        frames = wav_file.readframes(wav_file.getnframes())
                        combined_audio_data.append(frames)
                        combined_frames += wav_file.getnframes()
                        
                        # Add pause between segments (0.5 seconds)
                        if i < len(wav_files) - 1:
                            pause_samples = int(sample_rate * 0.5)  # 0.5 second pause
                            pause_data = struct.pack('<' + 'h' * pause_samples, *([0] * pause_samples))
                            combined_audio_data.append(pause_data)
                            combined_frames += pause_samples
                        
                        logger.info(f"✅ Added to combination: {audio_file}")
                        
                except Exception as e:
                    logger.error(f"❌ Could not read WAV file {audio_file}: {e}")
                    continue
            
            if combined_audio_data:
                # Write combined audio
                output_filename = f"podcast_combined_{uuid.uuid4()}.wav"
                output_path = os.path.join(settings.audio_folder, output_filename)
                
                with wave.open(output_path, 'w') as output_wav:
                    output_wav.setnchannels(1)  # Mono
                    output_wav.setsampwidth(2)  # 16-bit
                    output_wav.setframerate(sample_rate)
                    
                    # Write all combined data
                    for audio_data in combined_audio_data:
                        output_wav.writeframes(audio_data)
                
                if os.path.exists(output_path) and os.path.getsize(output_path) > 44:
                    logger.info(f"✅ Custom WAV combining successful: {output_filename}")
                    logger.info(f"✅ Combined frames: {combined_frames}")
                    logger.info(f"✅ File size: {os.path.getsize(output_path)} bytes")
                    
                    # Clean up individual files
                    for audio_file in wav_files:
                        try:
                            os.remove(os.path.join(settings.audio_folder, audio_file))
                            logger.info(f"🗑️ Cleaned up: {audio_file}")
                        except:
                            pass
                    
                    return output_filename
                else:
                    logger.error("❌ Custom combining produced invalid file")
                    
        except Exception as e:
            logger.error(f"❌ Custom WAV combining failed: {e}")
    
    # Return the first available file as fallback
    if audio_files_created:
        logger.info(f"⚠️ Returning first audio file as fallback: {audio_files_created[0]}")
        return audio_files_created[0]
    
    return None
