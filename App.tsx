
import React, { useState, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { Environment, PerspectiveCamera, OrbitControls, Loader } from '@react-three/drei';
import { EffectComposer, Bloom } from '@react-three/postprocessing';
import { TreeState } from './types';
import TreeExperience from './components/TreeExperience';
import HandTracker from './components/HandTracker';
import { EMERALD_DARK, GOLD_LUXURY } from './constants';

const App: React.FC = () => {
  const [treeState, setTreeState] = useState<TreeState>(TreeState.FORMED);
  const [handOffset, setHandOffset] = useState({ x: 0, y: 0 });
  const [isReady, setIsReady] = useState(false);

  // Gesture handling
  const handleGesture = (isOpen: boolean, position: { x: number, y: number }) => {
    setTreeState(isOpen ? TreeState.CHAOS : TreeState.FORMED);
    // Map 0-1 screen coordinates to range for camera movement
    setHandOffset({
      x: (position.x - 0.5) * 10,
      y: (0.5 - position.y) * 5
    });
  };

  return (
    <div className="relative w-full h-screen bg-[#011a11] overflow-hidden">
      {/* UI Overlay */}
      <div className="absolute top-8 left-8 z-10 pointer-events-none">
        <h1 className="luxury-text text-4xl md:text-6xl text-[#D4AF37] tracking-widest uppercase mb-2">
          Proyecto 231225
        </h1>
        <p className="text-[#D4AF37]/60 text-sm tracking-[0.3em] font-light">
          IMPERIAL EMERALD & GOLD EDITION
        </p>
      </div>

      <div className="absolute bottom-8 left-8 z-10 max-w-xs bg-black/40 backdrop-blur-md p-6 border border-[#D4AF37]/30 rounded-lg">
        <div className="flex items-center gap-4 mb-4">
          <div className={`w-3 h-3 rounded-full ${treeState === TreeState.CHAOS ? 'bg-red-500 animate-pulse' : 'bg-green-500 shadow-[0_0_10px_#22c55e]'}`}></div>
          <span className="text-[#D4AF37] font-semibold text-xs tracking-widest uppercase">
            Status: {treeState}
          </span>
        </div>
        <p className="text-white/60 text-[10px] leading-relaxed uppercase tracking-wider">
          Use hand gestures via camera. <br/>
          <b>Open Hand:</b> Unleash Chaos <br/>
          <b>Closed Fist:</b> Form Imperial Tree <br/>
          <b>Move Hand:</b> Adjust Perspective
        </p>
      </div>

      {/* Hand Tracker Component (Hidden video, handles logic) */}
      <HandTracker onUpdate={handleGesture} />

      {/* 3D Scene */}
      <Canvas shadows dpr={[1, 2]}>
        <color attach="background" args={['#011a11']} />
        
        <PerspectiveCamera makeDefault position={[0, 4, 20]} fov={45} />
        
        {/* Dynamic group moved by hand tracking */}
        <group position={[handOffset.x, handOffset.y, 0]}>
          <TreeExperience state={treeState} />
        </group>

        <Environment preset="lobby" />
        
        <ambientLight intensity={0.4} />
        <spotLight position={[10, 20, 10]} angle={0.15} penumbra={1} intensity={2} color={GOLD_LUXURY} castShadow />
        <pointLight position={[-10, -10, -10]} intensity={1} color="#025230" />

        <EffectComposer disableNormalPass>
          <Bloom 
            luminanceThreshold={0.8} 
            mipmapBlur 
            intensity={1.2} 
            radius={0.4}
          />
        </EffectComposer>

        <OrbitControls 
          enablePan={false} 
          enableZoom={true} 
          minDistance={10} 
          maxDistance={35} 
          autoRotate={treeState === TreeState.FORMED}
          autoRotateSpeed={0.5}
        />
      </Canvas>

      <Loader />
      
      {/* Decorative Border */}
      <div className="fixed inset-0 pointer-events-none border-[12px] border-[#D4AF37]/10 z-50"></div>
    </div>
  );
};

export default App;
