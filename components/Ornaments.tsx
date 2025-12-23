
import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { TreeState, OrnamentData } from '../types';
import { 
  ORNAMENT_COUNT, 
  TREE_HEIGHT, 
  TREE_RADIUS, 
  CHAOS_RADIUS, 
  ORNAMENT_COLORS, 
  GOLD_LUXURY 
} from '../constants';

interface OrnamentsProps {
  state: TreeState;
}

const Ornaments: React.FC<OrnamentsProps> = ({ state }) => {
  const ballMeshRef = useRef<THREE.InstancedMesh>(null!);
  const boxMeshRef = useRef<THREE.InstancedMesh>(null!);
  const lightMeshRef = useRef<THREE.InstancedMesh>(null!);

  const dummy = useMemo(() => new THREE.Object3D(), []);
  const targetProgress = state === TreeState.CHAOS ? 1 : 0;
  const currentProgress = useRef(0);

  const ornaments = useMemo(() => {
    const data: OrnamentData[] = [];
    for (let i = 0; i < ORNAMENT_COUNT; i++) {
      const type = i % 10 === 0 ? 'box' : (i % 3 === 0 ? 'ball' : 'light');
      
      // Chaos Pos
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      const r = Math.pow(Math.random(), 0.5) * CHAOS_RADIUS * 1.2;
      const chaosPos: [number, number, number] = [
        r * Math.sin(phi) * Math.cos(theta),
        r * Math.sin(phi) * Math.sin(theta),
        r * Math.cos(phi)
      ];

      // Target Pos
      const y = Math.random() * TREE_HEIGHT;
      const radiusAtY = (1 - y / TREE_HEIGHT) * TREE_RADIUS;
      const angle = Math.random() * Math.PI * 2;
      const targetPos: [number, number, number] = [
        Math.cos(angle) * radiusAtY,
        y - TREE_HEIGHT / 2,
        Math.sin(angle) * radiusAtY
      ];

      data.push({
        id: i,
        chaosPosition: chaosPos,
        targetPosition: targetPos,
        type,
        color: ORNAMENT_COLORS[Math.floor(Math.random() * ORNAMENT_COLORS.length)],
        weight: type === 'box' ? 1.5 : (type === 'ball' ? 1.0 : 0.5)
      });
    }
    return data;
  }, []);

  useFrame((state, delta) => {
    currentProgress.current = THREE.MathUtils.lerp(currentProgress.current, targetProgress, delta * 2.0);
    const time = state.clock.elapsedTime;

    let ballIdx = 0;
    let boxIdx = 0;
    let lightIdx = 0;

    ornaments.forEach((orn) => {
      // Use weight to affect the interpolation speed slightly (heavier = slower to return)
      const individualProgress = THREE.MathUtils.clamp(
        currentProgress.current * (2 - orn.weight * 0.5), 
        0, 
        1
      );

      const x = THREE.MathUtils.lerp(orn.targetPosition[0], orn.chaosPosition[0], individualProgress);
      const y = THREE.MathUtils.lerp(orn.targetPosition[1], orn.chaosPosition[1], individualProgress);
      const z = THREE.MathUtils.lerp(orn.targetPosition[2], orn.chaosPosition[2], individualProgress);

      dummy.position.set(x, y, z);
      
      if (state.pointer) {
          // Subtle hover rotation
          dummy.rotation.set(time * 0.2 * orn.weight, time * 0.3 * orn.weight, 0);
      }
      
      const scale = orn.type === 'light' ? 0.1 : (orn.type === 'box' ? 0.4 : 0.3);
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();

      if (orn.type === 'ball') {
        ballMeshRef.current.setMatrixAt(ballIdx, dummy.matrix);
        ballMeshRef.current.setColorAt(ballIdx, new THREE.Color(orn.color));
        ballIdx++;
      } else if (orn.type === 'box') {
        boxMeshRef.current.setMatrixAt(boxIdx, dummy.matrix);
        boxMeshRef.current.setColorAt(boxIdx, new THREE.Color(orn.color));
        boxIdx++;
      } else {
        lightMeshRef.current.setMatrixAt(lightIdx, dummy.matrix);
        lightMeshRef.current.setColorAt(lightIdx, new THREE.Color(GOLD_LUXURY));
        lightIdx++;
      }
    });

    ballMeshRef.current.instanceMatrix.needsUpdate = true;
    if (ballMeshRef.current.instanceColor) ballMeshRef.current.instanceColor.needsUpdate = true;
    boxMeshRef.current.instanceMatrix.needsUpdate = true;
    if (boxMeshRef.current.instanceColor) boxMeshRef.current.instanceColor.needsUpdate = true;
    lightMeshRef.current.instanceMatrix.needsUpdate = true;
    if (lightMeshRef.current.instanceColor) lightMeshRef.current.instanceColor.needsUpdate = true;
  });

  const ballCount = ornaments.filter(o => o.type === 'ball').length;
  const boxCount = ornaments.filter(o => o.type === 'box').length;
  const lightCount = ornaments.filter(o => o.type === 'light').length;

  return (
    <group>
      <instancedMesh ref={ballMeshRef} args={[undefined, undefined, ballCount]} castShadow>
        <sphereGeometry args={[1, 16, 16]} />
        <meshStandardMaterial metalness={0.8} roughness={0.1} />
      </instancedMesh>

      <instancedMesh ref={boxMeshRef} args={[undefined, undefined, boxCount]} castShadow>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial metalness={0.5} roughness={0.2} />
      </instancedMesh>

      <instancedMesh ref={lightMeshRef} args={[undefined, undefined, lightCount]}>
        <sphereGeometry args={[0.5, 8, 8]} />
        <meshBasicMaterial color={GOLD_LUXURY} />
      </instancedMesh>
    </group>
  );
};

export default Ornaments;
