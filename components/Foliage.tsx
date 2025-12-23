
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState } from '../types';
import { 
  FOLIAGE_COUNT, 
  TREE_HEIGHT, 
  TREE_RADIUS, 
  CHAOS_RADIUS, 
  EMERALD_BRIGHT, 
  GOLD_HIGHLIGHT 
} from '../constants';

const foliageVertexShader = `
  uniform float uTime;
  uniform float uProgress;
  attribute vec3 aChaosPos;
  attribute vec3 aTargetPos;
  attribute float aSize;
  varying vec3 vColor;

  void main() {
    // Lerp between chaos and target
    vec3 pos = mix(aTargetPos, aChaosPos, uProgress);
    
    // Add some subtle noise motion when in chaos
    if (uProgress > 0.1) {
      pos.x += sin(uTime + aChaosPos.y) * 0.2 * uProgress;
      pos.y += cos(uTime + aChaosPos.x) * 0.2 * uProgress;
      pos.z += sin(uTime + aChaosPos.z) * 0.2 * uProgress;
    }

    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
    gl_PointSize = aSize * (300.0 / -mvPosition.z);
    gl_Position = projectionMatrix * mvPosition;
    
    // Color variation
    vColor = mix(vec3(0.01, 0.2, 0.12), vec3(0.83, 0.68, 0.21), aSize * 0.5);
  }
`;

const foliageFragmentShader = `
  varying vec3 vColor;
  void main() {
    float dist = distance(gl_PointCoord, vec2(0.5));
    if (dist > 0.5) discard;
    float alpha = smoothstep(0.5, 0.3, dist);
    gl_FragColor = vec4(vColor, alpha);
  }
`;

interface FoliageProps {
  state: TreeState;
}

const Foliage: React.FC<FoliageProps> = ({ state }) => {
  const pointsRef = useRef<THREE.Points>(null!);
  const materialRef = useRef<THREE.ShaderMaterial>(null!);
  
  const targetProgress = state === TreeState.CHAOS ? 1 : 0;
  const currentProgress = useRef(0);

  const { positions, chaosPositions, targetPositions, sizes } = useMemo(() => {
    const pos = new Float32Array(FOLIAGE_COUNT * 3);
    const chaos = new Float32Array(FOLIAGE_COUNT * 3);
    const target = new Float32Array(FOLIAGE_COUNT * 3);
    const sz = new Float32Array(FOLIAGE_COUNT);

    for (let i = 0; i < FOLIAGE_COUNT; i++) {
      // Chaos: Random Sphere
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * CHAOS_RADIUS;
      
      chaos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      chaos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      chaos[i * 3 + 2] = r * Math.cos(phi);

      // Target: Cone (Christmas Tree)
      const y = Math.random() * TREE_HEIGHT;
      const radiusAtY = (1 - y / TREE_HEIGHT) * TREE_RADIUS;
      const angle = Math.random() * Math.PI * 2;
      
      target[i * 3] = Math.cos(angle) * radiusAtY * (0.8 + Math.random() * 0.4);
      target[i * 3 + 1] = y - TREE_HEIGHT / 2; // Center Y
      target[i * 3 + 2] = Math.sin(angle) * radiusAtY * (0.8 + Math.random() * 0.4);

      sz[i] = Math.random() * 0.15 + 0.05;
    }

    return { positions: pos, chaosPositions: chaos, targetPositions: target, sizes: sz };
  }, []);

  useFrame((state, delta) => {
    if (materialRef.current) {
      // Smooth lerp for the uniform progress
      currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, targetProgress, delta * 2.5);
      materialRef.current.uniforms.uProgress.value = currentProgress.current;
      materialRef.current.uniforms.uTime.value = state.clock.elapsedTime;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute 
          attach="attributes-position" 
          count={FOLIAGE_COUNT} 
          array={targetPositions} 
          itemSize={3} 
        />
        <bufferAttribute 
          attach="attributes-aChaosPos" 
          count={FOLIAGE_COUNT} 
          array={chaosPositions} 
          itemSize={3} 
        />
        <bufferAttribute 
          attach="attributes-aTargetPos" 
          count={FOLIAGE_COUNT} 
          array={targetPositions} 
          itemSize={3} 
        />
        <bufferAttribute 
          attach="attributes-aSize" 
          count={FOLIAGE_COUNT} 
          array={sizes} 
          itemSize={1} 
        />
      </bufferGeometry>
      <shaderMaterial 
        ref={materialRef}
        vertexShader={foliageVertexShader}
        fragmentShader={foliageFragmentShader}
        transparent
        uniforms={{
          uTime: { value: 0 },
          uProgress: { value: 0 }
        }}
      />
    </points>
  );
};

export default Foliage;
