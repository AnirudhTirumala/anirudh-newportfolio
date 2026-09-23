import { useEffect, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

// Kept in sync with the graphite / ice-blue / ember CSS palette. The scene
// uses original abstract hardware forms, not a copied design or image asset.
const CHROME = ["#e7edf1", "#aeb8c0", "#5e6870", "#252b2f"];
const ICE = "#b9e9ff";
const EMBER = "#ff764d";

interface FormSpec {
  position: [number, number, number];
  rotation: [number, number, number];
  size: number;
  spinSpeed: number;
  color: string;
}

function makeForms(count: number): FormSpec[] {
  return Array.from({ length: count }, (_, index) => ({
    position: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 8, -3 - Math.random() * 10],
    rotation: [Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI],
    size: 0.36 + Math.random() * 0.92,
    spinSpeed: 0.05 + Math.random() * 0.12,
    color: CHROME[index % CHROME.length],
  }));
}

function MetalForm({ spec, still }: { spec: FormSpec; still: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const geometry = useMemo(
    () => new THREE.BoxGeometry(spec.size * 1.75, spec.size * 0.38, spec.size * 0.9),
    [spec.size],
  );
  const edgeGeometry = useMemo(() => new THREE.EdgesGeometry(geometry), [geometry]);

  useFrame((_, delta) => {
    if (!ref.current || still) return;
    ref.current.rotation.x += delta * spec.spinSpeed * 0.45;
    ref.current.rotation.y += delta * spec.spinSpeed;
  });

  return (
    <group ref={ref} position={spec.position} rotation={spec.rotation}>
      <mesh geometry={geometry} castShadow>
        <meshStandardMaterial color={spec.color} metalness={0.94} roughness={0.22} envMapIntensity={1.7} />
      </mesh>
      <lineSegments geometry={edgeGeometry}>
        <lineBasicMaterial color={ICE} transparent opacity={0.14} />
      </lineSegments>
    </group>
  );
}

function ParticleField({ count = 110 }: { count?: number }) {
  const positions = useMemo(() => {
    const values = new Float32Array(count * 3);
    for (let index = 0; index < count; index++) {
      values[index * 3] = (Math.random() - 0.5) * 20;
      values[index * 3 + 1] = (Math.random() - 0.5) * 12;
      values[index * 3 + 2] = -2 - Math.random() * 14;
    }
    return values;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={ICE} size={0.025} sizeAttenuation transparent opacity={0.55} depthWrite={false} />
    </points>
  );
}

function LightTrails({ still }: { still: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const trails = useMemo(
    () =>
      Array.from({ length: 11 }, (_, index) => ({
        position: [(Math.random() - 0.5) * 15, (Math.random() - 0.5) * 8, -5 - Math.random() * 7] as [number, number, number],
        rotation: (Math.random() - 0.5) * 0.7,
        length: 1.8 + Math.random() * 4.8,
        color: index % 5 === 0 ? EMBER : ICE,
      })),
    [],
  );

  useFrame((_, delta) => {
    if (!ref.current || still) return;
    ref.current.position.x = Math.sin(performance.now() * 0.00013) * 0.35;
    ref.current.rotation.z += delta * 0.0025;
  });

  return (
    <group ref={ref}>
      {trails.map((trail, index) => (
        <mesh key={index} position={trail.position} rotation={[0, 0, trail.rotation]}>
          <planeGeometry args={[trail.length, 0.012]} />
          <meshBasicMaterial color={trail.color} transparent opacity={0.4} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      ))}
    </group>
  );
}

function CoreAssembly({ still }: { still: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current) return;
    if (!still) {
      ref.current.rotation.y += delta * 0.11;
      ref.current.rotation.z += delta * 0.025;
      ref.current.position.x += (state.pointer.x * 0.55 + 2.35 - ref.current.position.x) * 0.018;
      ref.current.position.y += (-state.pointer.y * 0.3 - ref.current.position.y) * 0.018;
    }
  });

  return (
    <group ref={ref} position={[2.35, 0, -3.8]}>
      <mesh rotation={[0.4, 0.2, 0]}>
        <icosahedronGeometry args={[1.18, 1]} />
        <meshStandardMaterial color="#c8d0d6" metalness={0.96} roughness={0.18} envMapIntensity={2} />
      </mesh>
      <mesh rotation={[1.2, 0.25, 0.7]}>
        <torusGeometry args={[1.48, 0.045, 10, 80]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.55} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[0.3, 1.1, 1.8]}>
        <torusGeometry args={[1.72, 0.028, 8, 80]} />
        <meshBasicMaterial color={EMBER} transparent opacity={0.32} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

function ParallaxRig({ children, still }: { children: React.ReactNode; still: boolean }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((state) => {
    if (still || !ref.current) return;
    ref.current.rotation.y += (state.pointer.x * 0.15 - ref.current.rotation.y) * 0.025;
    ref.current.rotation.x += (-state.pointer.y * 0.08 - ref.current.rotation.x) * 0.025;
  });
  return <group ref={ref}>{children}</group>;
}

/**
 * Gives the scene something to reflect.
 *
 * The forms below are near-perfect chrome (`metalness` ~0.95). In physically
 * based rendering a fully metallic surface has no diffuse response at all -
 * everything you see on it is reflected environment. With `envMapIntensity`
 * set but no environment ever assigned, they were reflecting an empty void
 * and rendering black, which is why the hero read as a flat dark rectangle
 * with the WebGL canvas doing nothing visible.
 *
 * Rather than pull in a dependency for a preset studio, this builds a tiny
 * environment out of the site's own palette - a cool key panel, a warm ember
 * fill, and a dim floor bounce - and pre-filters it once with PMREM. The
 * result is chrome that actually catches the brand colours as it turns.
 */
function PaletteEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color("#0b0d10");

    const panel = (color: string, intensity: number, size: [number, number], position: [number, number, number], lookAt: THREE.Vector3) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(size[0], size[1]),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
      );
      mesh.position.set(...position);
      mesh.lookAt(lookAt);
      envScene.add(mesh);
      return mesh;
    };

    const origin = new THREE.Vector3(0, 0, 0);
    panel("#f4fbff", 3.4, [9, 9], [-5, 6, 4], origin); // cool key, matching the directional light
    panel(ICE, 2.1, [8, 5], [6, 1, 3], origin); // ice rim from the right
    panel(EMBER, 1.15, [7, 4], [-5, -3, 1], origin); // the civic-work amber, kept low
    panel("#1b2026", 1, [16, 16], [0, -7, 0], new THREE.Vector3(0, 1, 0)); // floor bounce

    const target = pmrem.fromScene(envScene, 0.035);
    scene.environment = target.texture;

    return () => {
      scene.environment = null;
      target.dispose();
      pmrem.dispose();
      envScene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          (object.material as THREE.Material).dispose();
        }
      });
    };
  }, [gl, scene]);

  return null;
}

/** Interactive graphite-and-chrome hero field with depth and restrained light. */
export function DetectionField({ className }: { className?: string }) {
  const reducedMotion = useReducedMotion();
  const forms = useMemo(() => makeForms(12), []);

  return (
    <div className={className} aria-hidden="true">
      <Canvas dpr={[1, 1.25]} gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }} camera={{ position: [0, 0, 7.2], fov: 50, near: 0.1, far: 40 }}>
        <PaletteEnvironment />
        <ambientLight intensity={0.32} />
        <directionalLight position={[-3, 4, 5]} intensity={2.2} color="#f4fbff" />
        <pointLight position={[3, -1, 2]} intensity={17} distance={12} color={ICE} />
        <pointLight position={[-4, 1, 0]} intensity={8} distance={10} color={EMBER} />
        <ParallaxRig still={reducedMotion}>
          {forms.map((spec, index) => (
            <MetalForm key={index} spec={spec} still={reducedMotion} />
          ))}
          <ParticleField />
          <LightTrails still={reducedMotion} />
        </ParallaxRig>
        <CoreAssembly still={reducedMotion} />
      </Canvas>
    </div>
  );
}
