import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { useEffect } from "react";
import { Avatar } from "./Avatar2";
import { useThree } from "@react-three/fiber";

export const Experience = ({ avatar_voice, mouthLevel }) => {
  const texture = useTexture("textures/background.png");
  const viewport = useThree((state) => state.viewport);

  useEffect(() => {
    console.log("Experience props", { avatar_voice, mouthLevel });
  }, [avatar_voice]);
  return (
    <>
      <OrbitControls />
      <Avatar avatar_voice={avatar_voice} mouthLevel={mouthLevel} position={[0, -3.2, 5]} scale={2} />
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};

export function Experience2({ mouthLevel }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Avatar mouthLevel={mouthLevel} />
    </>
  );
}