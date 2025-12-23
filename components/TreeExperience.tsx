
import React from 'react';
import Foliage from './Foliage';
import Ornaments from './Ornaments';
import { TreeState } from '../types';

interface TreeExperienceProps {
  state: TreeState;
}

const TreeExperience: React.FC<TreeExperienceProps> = ({ state }) => {
  return (
    <group>
      <Foliage state={state} />
      <Ornaments state={state} />
      
      {/* Trunk */}
      <mesh position={[0, -2, 0]} receiveShadow>
        <cylinderGeometry args={[0.5, 0.7, 4, 32]} />
        <meshStandardMaterial color="#2d1b0d" roughness={0.9} />
      </mesh>
      
      {/* Base Pedestal */}
      <mesh position={[0, -4.5, 0]} receiveShadow>
        <cylinderGeometry args={[4, 5, 1, 64]} />
        <meshStandardMaterial color="#D4AF37" metalness={1} roughness={0.1} />
      </mesh>
    </group>
  );
};

export default TreeExperience;
