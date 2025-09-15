import { Environment, OrbitControls, useTexture } from "@react-three/drei";
import { Avatar2 } from "./Avatar2";
import { useThree } from "@react-three/fiber";

export const Experience2 = () => {
const texture = useTexture("textures/background.png");
const viewport = useThree((state) => state.viewport);
  return (
    <>   
      <OrbitControls />
      <Avatar2 position= {[0 , -2.5 , 3.8]} scale={1.8} />
      <Environment preset="sunset" />
      <mesh>
        <planeGeometry args={[viewport.width, viewport.height]} />
        <meshBasicMaterial map={texture} />
      </mesh>
    </>
  );
};
