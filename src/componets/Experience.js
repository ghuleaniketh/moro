import { Environment, useTexture } from "@react-three/drei";
import { useEffect } from "react";
import { Avatar } from "./Avatar";
import { useThree } from "@react-three/fiber";

export const Experience = ({ avatar_voice, mouthLevel }) => {
const texture = useTexture("textures/background.png")
const viewport = useThree((state) => state.viewport);

useEffect(() => {
  console.log("Experience props", { avatar_voice, mouthLevel });
}, [avatar_voice]);
  return (
    <>   
      <Avatar avatar_voice={avatar_voice} mouthLevel={mouthLevel} position= {[0 , -3.2 , 5]} scale={2} />
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};