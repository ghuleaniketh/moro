import React, { useEffect, useRef } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useGLTF, useFBX, useAnimations } from '@react-three/drei'
import { useControls } from 'leva'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

const corresponding = {
  A: "viseme_PP", B: "viseme_kk", C: "viseme_I", D: "viseme_AA",
  E: "viseme_O", F: "viseme_U", G: "viseme_FF", H: "viseme_TH",
  I: "viseme_S", J: "viseme_kk", K: "viseme_kk", L: "viseme_TH",
  M: "viseme_PP", N: "viseme_kk", O: "viseme_O", P: "viseme_PP",
  Q: "viseme_kk", R: "viseme_O", S: "viseme_S", T: "viseme_kk",
  U: "viseme_U", V: "viseme_FF", W: "viseme_U", X: "viseme_PP",
  Y: "viseme_I", Z: "viseme_S"
}

export function Avatar(props) {
  const { 
    playAudio, 
    script, 
    smoothness, 
    intensity, 
    playAnimation,
    animationSpeed 
  } = useControls({
    playAudio: false,
    script: { value: "audio_1" },
    smoothness: { value: 0.1, min: 0.01, max: 0.9 },
    intensity: { value: 0.8, min: 0.1, max: 1.5 },
    playAnimation: true, // New control for animation
    animationSpeed: { value: 1.0, min: 0.1, max: 3.0 } // Animation speed control
  });

  const audio = React.useMemo(() => new Audio(`/audio/${script}.mp3`), [script]);
  
  // Store current and target morph values
  const morphTargets = useRef({});
  const targetMorphs = useRef({});
  
  // Initialize morph target references
  const initializeMorphTargets = (nodes) => {
    Object.values(corresponding).forEach((viseme) => {
      if (!morphTargets.current[viseme]) {
        morphTargets.current[viseme] = 0;
        targetMorphs.current[viseme] = 0;
      }
    });
  };




  
  // Load the avatar model
  const { scene } = useGLTF('/models/68a202ee4dd25e58782ee8a7.glb')
  const clone = React.useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)



  // Load the FBX animation
  const simpleStand = useFBX("/animation/simpleStanding.fbx");
  // Clean up Mixamo animation and track names
  if (simpleStand.animations.length > 0) {
    simpleStand.animations[0].name = "simpleStand";
    simpleStand.animations[0].tracks.forEach(track => {
      track.name = track.name.replace('mixamo.com/', '').replace('mixamo.com|', '');
    });
  }
  const { actions, mixer } = useAnimations(simpleStand.animations, clone);

  // Always play the animation when available
  useEffect(() => {
    if (actions && actions.simpleStand) {
      actions.simpleStand.reset().play();
      actions.simpleStand.setEffectiveTimeScale(animationSpeed || 1);
      actions.simpleStand.loop = THREE.LoopRepeat;
    }
    return () => {
      if (actions && actions.simpleStand) actions.simpleStand.stop();
    };
  }, [actions, animationSpeed]);

  // Load lip sync data (with error handling)
  const [lipsync, setLipsync] = React.useState(null);
  useEffect(() => {
    const loadLipsync = async () => {
      try {
        const response = await fetch('/Rhubarb-Lip-Sync-1.14.0-macOS/audio_1.json');
        const data = await response.json();
        setLipsync(data);
      } catch (error) {
        setLipsync(null);
      }
    };
    loadLipsync();
  }, []);

  useFrame((state, delta) => {
    if (mixer) mixer.update(delta);
    // Lip sync logic (only if lipsync data is loaded)
    if (lipsync && nodes.Wolf3D_Head && nodes.Wolf3D_Teeth) {
      if (Object.keys(morphTargets.current).length === 0) {
        initializeMorphTargets(nodes);
      }
      const currentAudioTime = audio.currentTime;
      Object.values(corresponding).forEach((viseme) => {
        targetMorphs.current[viseme] = 0;
      });
      for (let i = 0; i < lipsync.mouthCues.length; i++) {
        const mouthCue = lipsync.mouthCues[i];
        if (currentAudioTime >= mouthCue.start && currentAudioTime <= mouthCue.end) {
          const viseme = corresponding[mouthCue.value];
          if (viseme) {
            const progress = (currentAudioTime - mouthCue.start) / (mouthCue.end - mouthCue.start);
            const blendFactor = Math.sin(progress * Math.PI);
            targetMorphs.current[viseme] = intensity * blendFactor;
          }
          break;
        }
      }
      Object.values(corresponding).forEach((viseme) => {
        const currentValue = morphTargets.current[viseme] || 0;
        const targetValue = targetMorphs.current[viseme] || 0;
        morphTargets.current[viseme] = THREE.MathUtils.lerp(
          currentValue,
          targetValue,
          smoothness * 60 * delta
        );
        const headDict = nodes.Wolf3D_Head.morphTargetDictionary;
        const teethDict = nodes.Wolf3D_Teeth.morphTargetDictionary;
        if (headDict && headDict[viseme] !== undefined) {
          nodes.Wolf3D_Head.morphTargetInfluences[headDict[viseme]] = morphTargets.current[viseme];
        }
        if (teethDict && teethDict[viseme] !== undefined) {
          nodes.Wolf3D_Teeth.morphTargetInfluences[teethDict[viseme]] = morphTargets.current[viseme];
        }
      });
    }
  });

  useEffect(() => {
    if (playAudio) {
      audio.currentTime = 0; // Reset audio to start
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [playAudio, script]);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);

  return (
    <group {...props} dispose={null}>
      <primitive object={nodes.Hips} />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Hair.geometry} 
        material={materials.Wolf3D_Hair} 
        skeleton={nodes.Wolf3D_Hair.skeleton} 
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Body.geometry} 
        material={materials.Wolf3D_Body} 
        skeleton={nodes.Wolf3D_Body.skeleton} 
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Outfit_Bottom.geometry} 
        material={materials.Wolf3D_Outfit_Bottom} 
        skeleton={nodes.Wolf3D_Outfit_Bottom.skeleton} 
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Outfit_Footwear.geometry} 
        material={materials.Wolf3D_Outfit_Footwear} 
        skeleton={nodes.Wolf3D_Outfit_Footwear.skeleton} 
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Outfit_Top.geometry} 
        material={materials.Wolf3D_Outfit_Top} 
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton} 
      />
      <skinnedMesh 
        name="EyeLeft" 
        geometry={nodes.EyeLeft.geometry} 
        material={materials.Wolf3D_Eye} 
        skeleton={nodes.EyeLeft.skeleton} 
        morphTargetDictionary={nodes.EyeLeft.morphTargetDictionary} 
        morphTargetInfluences={nodes.EyeLeft.morphTargetInfluences} 
      />
      <skinnedMesh 
        name="EyeRight" 
        geometry={nodes.EyeRight.geometry} 
        material={materials.Wolf3D_Eye} 
        skeleton={nodes.EyeRight.skeleton} 
        morphTargetDictionary={nodes.EyeRight.morphTargetDictionary} 
        morphTargetInfluences={nodes.EyeRight.morphTargetInfluences} 
      />
      <skinnedMesh 
        name="Wolf3D_Head" 
        geometry={nodes.Wolf3D_Head.geometry} 
        material={materials.Wolf3D_Skin} 
        skeleton={nodes.Wolf3D_Head.skeleton} 
        morphTargetDictionary={nodes.Wolf3D_Head.morphTargetDictionary} 
        morphTargetInfluences={nodes.Wolf3D_Head.morphTargetInfluences} 
      />
      <skinnedMesh 
        name="Wolf3D_Teeth" 
        geometry={nodes.Wolf3D_Teeth.geometry} 
        material={materials.Wolf3D_Teeth} 
        skeleton={nodes.Wolf3D_Teeth.skeleton} 
        morphTargetDictionary={nodes.Wolf3D_Teeth.morphTargetDictionary} 
        morphTargetInfluences={nodes.Wolf3D_Teeth.morphTargetInfluences} 
      />
    </group>
  )
}

useGLTF.preload('/models/68a202ee4dd25e58782ee8a7.glb')