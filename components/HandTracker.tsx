
import React, { useEffect, useRef } from 'react';

interface HandTrackerProps {
  onUpdate: (isOpen: boolean, position: { x: number; y: number }) => void;
}

const HandTracker: React.FC<HandTrackerProps> = ({ onUpdate }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const handsRef = useRef<any>(null);
  const cameraRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const loadScript = (src: string) => {
      return new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error(`Failed to load script: ${src}`));
        document.body.appendChild(script);
      });
    };

    const initMediaPipe = async () => {
      try {
        // Ensure both scripts are loaded before proceeding to avoid race conditions
        await Promise.all([
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js'),
          loadScript('https://cdn.jsdelivr.net/npm/@mediapipe/camera_utils/camera_utils.js')
        ]);

        if (!isMounted) return;

        // @ts-ignore
        const { Hands, Camera } = window;

        if (!Hands || !Camera) {
          console.error('MediaPipe Hands or Camera not found on window object');
          return;
        }

        const hands = new Hands({
          locateFile: (file: string) => `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`,
        });

        hands.setOptions({
          maxNumHands: 1,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        hands.onResults((results: any) => {
          if (results.multiHandLandmarks && results.multiHandLandmarks.length > 0) {
            const landmarks = results.multiHandLandmarks[0];
            
            // Heuristic for open/closed hand
            const middleFingerTip = landmarks[12];
            const middleFingerMCP = landmarks[9];

            const dist = Math.sqrt(
              Math.pow(middleFingerTip.x - middleFingerMCP.x, 2) + 
              Math.pow(middleFingerTip.y - middleFingerMCP.y, 2)
            );
            
            // Hand is likely open if distance between tip and MCP is large
            const isOpen = dist > 0.08; 

            // Average position for camera panning
            const avgX = landmarks.reduce((sum: number, lm: any) => sum + lm.x, 0) / landmarks.length;
            const avgY = landmarks.reduce((sum: number, lm: any) => sum + lm.y, 0) / landmarks.length;

            onUpdate(isOpen, { x: avgX, y: avgY });
          }
        });

        handsRef.current = hands;

        if (videoRef.current) {
          const camera = new Camera(videoRef.current, {
            onFrame: async () => {
              if (videoRef.current && handsRef.current) {
                await handsRef.current.send({ image: videoRef.current });
              }
            },
            width: 640,
            height: 480,
          });
          camera.start();
          cameraRef.current = camera;
        }
      } catch (error) {
        console.error('Error initializing MediaPipe:', error);
      }
    };

    initMediaPipe();

    return () => {
      isMounted = false;
      if (cameraRef.current) {
        cameraRef.current.stop();
      }
    };
  }, []);

  return (
    <div className="fixed top-4 right-4 z-50 w-32 h-24 border-2 border-[#D4AF37]/40 rounded-lg overflow-hidden opacity-50 hover:opacity-100 transition-opacity">
      <video 
        ref={videoRef} 
        className="w-full h-full object-cover scale-x-[-1]" 
        autoPlay 
        muted 
        playsInline 
      />
      <div className="absolute top-1 left-1 text-[8px] text-white bg-black/50 px-1 rounded">CAM FEED</div>
    </div>
  );
};

export default HandTracker;
