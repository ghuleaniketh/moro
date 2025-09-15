import { Canvas } from "@react-three/fiber";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Experience } from "./components/Experience";
import { Experience2 } from "./components/Experience2";

function App() {
  return (
    <Router>
      <Routes>
        <Route
          path="/"
          element={
            <Canvas shadows camera={{ position: [0, 0, 8], fov: 30 }}>
              <color attach="background" args={["#ececec"]} />
              <Experience />
            </Canvas>
          }
        />
        <Route
          path="/avatar2"
          element={
            <Canvas shadows camera={{ position: [0, 0, 8], fov: 30 }}>
              <color attach="background" args={["#ececec"]} />
              <Experience2 />
            </Canvas>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
