import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { useEffect } from "react";
import { Avatar } from "./Avatar";
import { useThree } from "@react-three/fiber";

export const Experience = ({ avatar_voice }) => {
const texture = useTexture("textures/background.png")
const viewport = useThree((state) => state.viewport);

useEffect(() => {
  console.log("This is call from Experience component and this is proof that i am getting data of ", avatar_voice);
}, [avatar_voice]);
  return (
    <>   
      <OrbitControls />
      <Avatar avatar_voice={avatar_voice} position= {[0 , -3.2 , 5]} scale={2} />
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};