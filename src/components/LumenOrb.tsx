"use client";
import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import * as THREE from "three";

function Orb({ accent }: { accent: string }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame((_, delta) => { if (ref.current) { ref.current.rotation.x += delta * .12; ref.current.rotation.y += delta * .18; } });
  return <mesh ref={ref}><icosahedronGeometry args={[1.45, 5]} /><meshStandardMaterial color={accent} roughness={.2} metalness={.65} wireframe /></mesh>;
}
export default function LumenOrb({ accent = "#b7ff4a" }: { accent?: string }) { return <Canvas camera={{ position:[0,0,4.2], fov:38 }} dpr={[1,1.5]}><ambientLight intensity={.35} /><pointLight position={[2,2,3]} intensity={7} color={accent} /><Orb accent={accent} /></Canvas>; }
