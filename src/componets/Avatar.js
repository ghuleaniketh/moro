import React, { use, useEffect, useRef } from 'react'
import { useFrame, useGraph, useLoader } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import { useControls } from 'leva'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

const corresponding = {
  A: 'viseme_PP', B: 'viseme_kk', C: 'viseme_I', D: 'viseme_AA',
  E: 'viseme_O', F: 'viseme_U', G: 'viseme_FF', H: 'viseme_TH',
  I: 'viseme_S', J: 'viseme_kk', K: 'viseme_kk', L: 'viseme_TH',
  M: 'viseme_PP', N: 'viseme_kk', O: 'viseme_O', P: 'viseme_PP',
  Q: 'viseme_kk', R: 'viseme_O', S: 'viseme_S', T: 'viseme_kk',
  U: 'viseme_U', V: 'viseme_FF', W: 'viseme_U', X: 'viseme_PP',
  Y: 'viseme_I', Z: 'viseme_S'
}

const extraVisemes = [
  'viseme_CH',
  'viseme_DD',
  'viseme_E',
  'viseme_EE',
  'viseme_IH',
  'viseme_OH',
  'viseme_OU',
  'viseme_RR',
  'viseme_SS',
  'viseme_nn',
  'viseme_T',
  'viseme_V'
]

const trackedVisemes = [...new Set([...Object.values(corresponding), ...Object.keys(corresponding)])]

export function Avatar({ avatar_voice, mouthLevel = 0, ...props }) {
  const { smoothness, intensity } = useControls({
    smoothness: { value: 0.1, min: 0.01, max: 0.9 },
    intensity: { value: 0.8, min: 0.1, max: 1.5 }
  });

  const morphTargets = useRef({})

  const initializeMorphTargets = (nodes) => {
    trackedVisemes.forEach((viseme) => {
      if (!morphTargets.current[viseme]) {
        morphTargets.current[viseme] = 0;
      }
    });
  };

  const { scene } = useGLTF('/models/68a202ee4dd25e58782ee8a7.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)

  useEffect(() => {
    if (nodes.Hips && nodes.Hips.children) {
      console.log('Model bones:', nodes.Hips.children.map(bone => bone.name));
    }
  }, [nodes]);

  useFrame((state, delta) => {
    if (!nodes.Wolf3D_Head || !nodes.Wolf3D_Teeth) return;
    if (Object.keys(morphTargets.current).length === 0) {
      initializeMorphTargets(nodes);
    }
  });

  // Apply mouthLevel to morph targets (simple mapping to a few visemes)
  useFrame(() => {
    if (!nodes.Wolf3D_Head) return;
    // ensure morphTargets are initialized
    if (Object.keys(morphTargets.current).length === 0) initializeMorphTargets(nodes);

    // Map mouthLevel to viseme targets
  const normalized = Math.max(0, Math.min(1, mouthLevel));
  const target = Math.min(1, normalized * 0.32 * intensity);

    const wide = Math.min(1, target * 0.85);
    const narrow = target * 0.5;
    const consonant = Math.min(target * 0.8, 0.55);

    const targetVals = {};
    trackedVisemes.forEach((viseme) => {
      targetVals[viseme] = 0;
    });

    targetVals.viseme_AA = target;
    targetVals.viseme_E = wide * 0.8;
    targetVals.viseme_I = wide * 0.7;
    targetVals.viseme_EE = wide * 0.65;
    targetVals.viseme_IH = wide * 0.6;
    targetVals.viseme_O = target * 0.75;
    targetVals.viseme_OH = target * 0.72;
    targetVals.viseme_OU = target * 0.65;
    targetVals.viseme_U = narrow;
    targetVals.viseme_PP = consonant * 0.55;
    targetVals.viseme_FF = consonant * 0.6;
    targetVals.viseme_TH = consonant * 0.55;
    targetVals.viseme_DD = consonant * 0.5;
    targetVals.viseme_CH = consonant * 0.65;
    targetVals.viseme_SS = consonant * 0.45;
    targetVals.viseme_S = consonant * 0.35;
    targetVals.viseme_T = consonant * 0.5;
    targetVals.viseme_kk = consonant * 0.6;
    targetVals.viseme_nn = consonant * 0.4;
    targetVals.viseme_RR = target * 0.3;
    targetVals.viseme_V = consonant * 0.45;

    // Smooth and apply
    Object.entries(targetVals).forEach(([viseme, val]) => {
      const cur = morphTargets.current[viseme] || 0;
      const next = THREE.MathUtils.lerp(cur, val, smoothness);
      morphTargets.current[viseme] = THREE.MathUtils.clamp(next, 0, 1);
    });

    // Write morph target influences into meshes that have them
    ['Wolf3D_Head', 'Wolf3D_Teeth', 'Wolf3D_Body'].forEach((meshName) => {
      const mesh = nodes[meshName];
      if (!mesh || !mesh.morphTargetDictionary || !mesh.morphTargetInfluences) return;
      Object.keys(morphTargets.current).forEach((viseme) => {
        const idx = mesh.morphTargetDictionary[viseme];
        if (typeof idx === 'number') {
          mesh.morphTargetInfluences[idx] = morphTargets.current[viseme];
        }
      });
    });
  });

  return (
    <group {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      {['Wolf3D_Hair', 'Wolf3D_Body', 'Wolf3D_Outfit_Bottom', 'Wolf3D_Outfit_Footwear', 'Wolf3D_Outfit_Top', 'EyeLeft', 'EyeRight', 'Wolf3D_Head', 'Wolf3D_Teeth'].map((key) => (
        <skinnedMesh
          key={key}
          name={key}
          geometry={nodes[key].geometry}
          material={materials[nodes[key].material?.name] || materials.Wolf3D_Skin}
          skeleton={nodes[key].skeleton}
          morphTargetDictionary={nodes[key].morphTargetDictionary}
          morphTargetInfluences={nodes[key].morphTargetInfluences}
        />
      ))}
    </group>
  )
}

useGLTF.preload('/models/68a202ee4dd25e58782ee8a7.glb')
