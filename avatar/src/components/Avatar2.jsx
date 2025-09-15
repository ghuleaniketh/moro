import React, { useEffect, useMemo, useRef } from 'react'
import { useFrame, useGraph } from '@react-three/fiber'
import { useAnimations, useFBX, useGLTF } from '@react-three/drei'
import { SkeletonUtils } from 'three-stdlib'
import * as THREE from 'three'

//hello bro
// Viseme mapping from your working code
const corresponding = {
  A: "viseme_PP", B: "viseme_kk", C: "viseme_I", D: "viseme_AA",
  E: "viseme_O", F: "viseme_U", G: "viseme_FF", H: "viseme_TH",
  I: "viseme_S", J: "viseme_kk", K: "viseme_kk", L: "viseme_TH",
  M: "viseme_PP", N: "viseme_kk", O: "viseme_O", P: "viseme_PP",
  Q: "viseme_kk", R: "viseme_O", S: "viseme_S", T: "viseme_kk",
  U: "viseme_U", V: "viseme_FF", W: "viseme_U", X: "viseme_PP",
  Y: "viseme_I", Z: "viseme_S"
}
//test
// Bone mapping between your avatar and Mixamo animations
const BONE_MAPPING = {
  'mixamorigHips': 'Hips',
  'mixamorigSpine': 'Spine',
  'mixamorigSpine1': 'Spine1',
  'mixamorigSpine2': 'Spine2',
  'mixamorigNeck': 'Neck',
  'mixamorigHead': 'Head',
  'mixamorigLeftShoulder': 'LeftShoulder',
  'mixamorigLeftArm': 'LeftArm',
  'mixamorigLeftForeArm': 'LeftForeArm',
  'mixamorigLeftHand': 'LeftHand',
  'mixamorigRightShoulder': 'RightShoulder',
  'mixamorigRightArm': 'RightArm',
  'mixamorigRightForeArm': 'RightForeArm',
  'mixamorigRightHand': 'RightHand',
  'mixamorigLeftUpLeg': 'LeftUpLeg',
  'mixamorigLeftLeg': 'LeftLeg',
  'mixamorigLeftFoot': 'LeftFoot',
  'mixamorigLeftToeBase': 'LeftToeBase',
  'mixamorigRightUpLeg': 'RightUpLeg',
  'mixamorigRightLeg': 'RightLeg',
  'mixamorigRightFoot': 'RightFoot',
  'mixamorigRightToeBase': 'RightToeBase',
}

// Hardcoded bone rotation values from your Leva controls
const BONE_ROTATIONS = {
  leftShoulderY: -0.3,
  leftShoulderZ: -1.2,
  rightShoulderY: 0.04,
  rightShoulderZ: 1.17,
  leftArmX: 0.9,
  rightArmX: 1.22
}

// Function to retarget animation to match your avatar's skeleton
function retargetAnimation(animation, targetSkeleton) {
  const retargetedTracks = []
  
  animation.tracks.forEach(track => {
    const boneName = track.name.split('.')[0]
    const property = track.name.split('.')[1]
    
    const mappedBoneName = BONE_MAPPING[boneName] || boneName
    const targetBone = targetSkeleton.getBoneByName(mappedBoneName)
    
    if (targetBone) {
      const newTrack = track.clone()
      newTrack.name = `${mappedBoneName}.${property}`
      retargetedTracks.push(newTrack)
    } else {
      console.warn(`Bone ${mappedBoneName} not found in target skeleton`)
    }
  })
  
  const retargetedAnimation = new THREE.AnimationClip(
    animation.name + '_retargeted',
    animation.duration,
    retargetedTracks
  )
  
  return retargetedAnimation
}

// Custom hook for skeleton analysis
function useSkeletonAnalysis(skeleton) {
  return useMemo(() => {
    if (!skeleton) return { bones: [], boneNames: [] }
    
    const bones = []
    const boneNames = []
    
    skeleton.bones.forEach(bone => {
      bones.push(bone)
      boneNames.push(bone.name)
    })
    
    return { bones, boneNames }
  }, [skeleton])
}

export function Avatar2(props) {
  // Simplified props with hardcoded values for lip sync
  const {
    playAudio = false,
    script = "MyAudio",
    smoothness = 0.1,
    intensity = 0.8
  } = props

  const animationSpeed = 0.53;
  const audio = useMemo(() => new Audio(`/audio/${script}.mp3`), [script]);
  
  const morphTargets = useRef({});
  const targetMorphs = useRef({});
  
  const initializeMorphTargets = () => {
    Object.values(corresponding).forEach((viseme) => {
      if (!morphTargets.current[viseme]) {
        morphTargets.current[viseme] = 0;
        targetMorphs.current[viseme] = 0;
      }
    });
  };

  const [lipsync, setLipsync] = React.useState(null);
  useEffect(() => {
    const loadLipsync = async () => {
      try {
        const response = await fetch(`/Rhubarb-Lip-Sync-1.14.0-Windows/${script}.json`);
        const data = await response.json();
        console.log('Loaded lipsync data:', data);
        setLipsync(data);
      } catch (error) {
        console.error('Failed to load lipsync data:', error);
        setLipsync(null);
      }
    };
    loadLipsync();
  }, [script]);

  const { scene } = useGLTF('/models/68bd28f54b2306b86e4faf0b.glb')
  const clone = useMemo(() => SkeletonUtils.clone(scene), [scene])
  const { nodes, materials } = useGraph(clone)
  
  const simpleStand = useFBX('/animation/simpleStanding.fbx')
  // const simpleStand2 = useFBX('/animation.stand.fbx') 
  
  const avatarSkeleton = useMemo(() => {
    const skinnedMeshes = [
      nodes.Wolf3D_Body,
      nodes.Wolf3D_Head,
      nodes.Wolf3D_Hair
    ].filter(Boolean)
    
    return skinnedMeshes[0]?.skeleton
  }, [nodes])
  
  const avatarSkeletonInfo = useSkeletonAnalysis(avatarSkeleton)
  const animationBones = useMemo(() => {
    if (!simpleStand.animations[0]) return []
    return [...new Set(simpleStand.animations[0].tracks.map(track => track.name.split('.')[0]))]
  }, [simpleStand])
  
  const retargetedAnimations = useMemo(() => {
    if (!simpleStand.animations[0] || !avatarSkeleton) return []
    
    const retargetedAnimation = retargetAnimation(simpleStand.animations[0], avatarSkeleton)
    retargetedAnimation.name = "simpleStand"
    
    return [retargetedAnimation]
  }, [simpleStand, avatarSkeleton])
  
  const group = useRef()
  const { actions, mixer } = useAnimations(retargetedAnimations, group)
  
  // Store bone references for permanent positioning
  const leftShoulderBone = useRef()
  const rightShoulderBone = useRef()
  const leftArmBone = useRef()
  const rightArmBone = useRef()
  
  // Get bone references when skeleton is available
  useEffect(() => {
    if (avatarSkeleton) {
      leftShoulderBone.current = avatarSkeleton.getBoneByName('LeftShoulder')
      rightShoulderBone.current = avatarSkeleton.getBoneByName('RightShoulder')
      leftArmBone.current = avatarSkeleton.getBoneByName('LeftArm')
      rightArmBone.current = avatarSkeleton.getBoneByName('RightArm')
    }
  }, [avatarSkeleton])
  
  useEffect(() => {
    console.log('=== SKELETON ANALYSIS ===')
    console.log('Avatar bones:', avatarSkeletonInfo.boneNames)
    console.log('Animation bones:', animationBones)
    console.log('Retargeted animations:', retargetedAnimations.length)
    
    const missingBones = animationBones.filter(animBone => {
      const mappedName = BONE_MAPPING[animBone] || animBone
      return !avatarSkeletonInfo.boneNames.includes(mappedName)
    })
    
    if (missingBones.length > 0) {
      console.warn('Missing bones in avatar:', missingBones)
      console.log('You may need to update the BONE_MAPPING object')
    }
  }, [avatarSkeletonInfo, animationBones, retargetedAnimations])
  
  useEffect(() => {
    if (actions?.simpleStand) {
      console.log('Playing retargeted animation')
      actions.simpleStand.reset().fadeIn(0.5).play()
      actions.simpleStand.setEffectiveTimeScale(animationSpeed)
      actions.simpleStand.loop = THREE.LoopRepeat
      
      return () => {
        if (actions.simpleStand) {
          actions.simpleStand.fadeOut(0.5)
        }
      }
    } else {
      console.warn('Retargeted animation not found')
    }
  }, [actions, animationSpeed])
  
  // Main animation and permanent shoulder positioning frame update
  useFrame((state, delta) => {
    // Update animation mixer
    if (mixer) mixer.update(delta);
    
    // Apply permanent hardcoded bone rotations for perfect shoulder positioning
    if (leftShoulderBone.current) {
      leftShoulderBone.current.rotation.y = BONE_ROTATIONS.leftShoulderY
      leftShoulderBone.current.rotation.z = BONE_ROTATIONS.leftShoulderZ
    }
    
    if (rightShoulderBone.current) {
      rightShoulderBone.current.rotation.y = BONE_ROTATIONS.rightShoulderY
      rightShoulderBone.current.rotation.z = BONE_ROTATIONS.rightShoulderZ
    }
    
    // Apply permanent arm rotations for natural positioning
    if (leftArmBone.current) {
      leftArmBone.current.rotation.x = BONE_ROTATIONS.leftArmX
    }
    
    if (rightArmBone.current) {
      rightArmBone.current.rotation.x = BONE_ROTATIONS.rightArmX
    }
    
    // Lip sync logic
    if (lipsync && nodes.Wolf3D_Head && nodes.Wolf3D_Teeth) {
      if (Object.keys(morphTargets.current).length === 0) {
        initializeMorphTargets();
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
  })
  
  useEffect(() => {
    if (playAudio) {
      audio.currentTime = 0;
      audio.play().catch(console.error);
    } else {
      audio.pause();
    }
  }, [playAudio, script]);

  useEffect(() => {
    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [audio]);
  
  return (
    <>
    <group {...props} dispose={null} ref={group}>
      <primitive object={nodes.Hips} />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Hair.geometry} 
        material={materials.Wolf3D_Hair} 
        skeleton={nodes.Wolf3D_Hair.skeleton} 
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Glasses.geometry} 
        material={materials.Wolf3D_Glasses} 
        skeleton={nodes.Wolf3D_Glasses.skeleton} 
      />
      <skinnedMesh 
        geometry={nodes.Wolf3D_Outfit_Top.geometry} 
        material={materials.Wolf3D_Outfit_Top} 
        skeleton={nodes.Wolf3D_Outfit_Top.skeleton} 
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
        geometry={nodes.Wolf3D_Body.geometry} 
        material={materials.Wolf3D_Body} 
        skeleton={nodes.Wolf3D_Body.skeleton} 
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
    </>
  )
}

useGLTF.preload('/models/68bd28f54b2306b86e4faf0b.glb')
