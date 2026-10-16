"use client";

import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

export type ThinkPhase = "idle" | "thinking" | "composing" | "ready";

const COUNT = 4000;
const seeded = (n: number) => Math.abs((Math.sin(n * 12.9898) * 43758.5453) % 1);
const fallbackPalette = ["#b77aff", "#ff62df", "#57e8ff", "#f5d27a", "#f5f2e9"];

function paletteColor(value: string) { return new THREE.Color(value || "#f5f2e9"); }

function InstancedCloud({ phase, palette, progress }: { phase: ThinkPhase; palette: string[]; progress: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const seeds = useMemo(() => Array.from({ length: COUNT }, (_, index) => ({ x: seeded(index * 3) * 2 - 1, y: seeded(index * 3 + 1) * 2 - 1, z: seeded(index * 3 + 2) * 2 - 1, speed: .2 + seeded(index + 9) * .8, cluster: index % 5 })), []);
  const colors = useMemo(() => (palette.length >= 5 ? palette : fallbackPalette).map(paletteColor), [palette]);
  useFrame(({ clock, pointer }) => {
    if (!mesh.current) return;
    const time = clock.elapsedTime;
    const active = phase !== "idle";
    for (let index = 0; index < COUNT; index++) {
      const seed = seeds[index]; const cluster = active ? seed.cluster : 0; const angle = time * (.08 + seed.speed * .04) + seed.x * 5.2; const radius = active ? .34 + cluster * .08 : 1.15 + seed.z * .25; let x = seed.x * radius; let y = seed.y * radius; let z = seed.z * radius;
      if (phase === "composing") { const burst = Math.min(1, progress * 1.3); x = x * (1 - burst) + Math.cos(angle) * (.2 + cluster * .13) * burst; y = y * (1 - burst) + Math.sin(angle) * (.2 + cluster * .13) * burst; z = z * (1 - burst) + Math.sin(angle * 1.7) * .16 * burst; }
      if (phase === "ready") { const merge = Math.min(1, progress || 1); x *= 1 - merge * .72; y *= 1 - merge * .72; z *= 1 - merge * .72; }
      const drift = active ? .02 : .08; x += Math.sin(time * seed.speed + seed.y) * drift + pointer.x * .035; y += Math.cos(time * seed.speed + seed.x) * drift + pointer.y * .035;
      dummy.position.set(x, y, z); const size = phase === "ready" ? .014 + Math.sin(time * 3 + index) * .004 : .009 + (index % 7 === 0 ? .009 : 0); dummy.scale.setScalar(size); dummy.updateMatrix(); mesh.current.setMatrixAt(index, dummy.matrix); mesh.current.setColorAt(index, colors[seed.cluster % colors.length]);
    }
    mesh.current.instanceMatrix.needsUpdate = true; if (mesh.current.instanceColor) mesh.current.instanceColor.needsUpdate = true;
  });
  return <instancedMesh ref={mesh} args={[undefined, undefined, COUNT]} frustumCulled={false}><sphereGeometry args={[1, 5, 5]} /><meshBasicMaterial transparent opacity={.82} depthWrite={false} blending={THREE.AdditiveBlending} /></instancedMesh>;
}

function KeyForms({ phase, palette }: { phase: ThinkPhase; palette: string[] }) {
  const color = palette[0] || fallbackPalette[0];
  return <group visible={phase === "composing" || phase === "ready"}><mesh position={[-.72, .48, .1]}><sphereGeometry args={[.13, 16, 16]} /><meshBasicMaterial color={palette[1] || color} transparent opacity={.85} blending={THREE.AdditiveBlending} /></mesh><mesh position={[-.4, .48, .1]}><sphereGeometry args={[.1, 16, 16]} /><meshBasicMaterial color={palette[2] || color} transparent opacity={.8} blending={THREE.AdditiveBlending} /></mesh><mesh position={[.56, .12, .1]} rotation={[0, 0, -.4]}><torusGeometry args={[.2, .012, 8, 48]} /><meshBasicMaterial color={palette[3] || color} transparent opacity={.8} blending={THREE.AdditiveBlending} /></mesh><mesh position={[.62, -.44, .1]}><ringGeometry args={[.18, .2, 32]} /><meshBasicMaterial color={palette[4] || color} transparent opacity={.8} blending={THREE.AdditiveBlending} /></mesh></group>;
}

export default function ThinkCanvas({ phase, palette, progress }: { phase: ThinkPhase; palette: string[]; progress: number }) { return <Canvas className="think-r3f" dpr={[1, 2]} camera={{ position: [0, 0, 3], fov: 42 }} gl={{ alpha: true, antialias: true }}><color attach="background" args={["#080808"]} /><InstancedCloud phase={phase} palette={palette} progress={progress} /><KeyForms phase={phase} palette={palette} /></Canvas>; }
