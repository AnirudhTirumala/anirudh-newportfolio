import { useEffect, useMemo, useRef, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";
import { useReducedMotion } from "@/hooks/useReducedMotion";

/**
 * One 3D world behind the entire page.
 *
 * The site used to mount a WebGL scene inside the hero alone, which meant the
 * depth stopped the moment you scrolled and every section below it was flat.
 * This is a single fixed canvas the whole document scrolls over: the camera
 * dollies forward through a layered field as you go, so the page reads as a
 * move through one space rather than a stack of cards. One canvas, one
 * context - mounting a second scene per section would multiply the cost for
 * no visual gain.
 *
 * Gated to pointer-capable desktop widths and switched off entirely under
 * `prefers-reduced-motion`, where the CSS instrument graphics carry the page
 * on their own.
 */

const ICE = "#b9e9ff";
const EMBER = "#ff764d";
const CHROME = ["#e7edf1", "#aeb8c0", "#7d868e", "#3a4147"];

/** How far the camera travels, in world units, across the whole document. */
const DOLLY_DEPTH = 26;

/** Scroll progress 0-1, kept outside React. `useFrame` reads it every frame,
 *  so routing it through state would re-render the tree sixty times a second
 *  for a value nothing in the DOM renders. */
const scroll = { progress: 0, velocity: 0 };

function useScrollProgress() {
  useEffect(() => {
    let previous = 0;
    // `scrollHeight` is a layout read, and reading it inside the scroll handler
    // forced a reflow on every single scroll event. It only changes when the
    // document does, so it is cached here and refreshed on resize and on the
    // content settling instead.
    let max = 1;
    const measure = () => {
      max = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    };
    const update = () => {
      const next = Math.min(1, Math.max(0, window.scrollY / max));
      scroll.velocity = next - previous;
      previous = next;
      scroll.progress = next;
    };

    measure();
    update();

    // Sections reveal on scroll and images arrive late, so the document keeps
    // growing for a while after load. A ResizeObserver on the body catches that
    // without putting the read back on the scroll path.
    const observer = new ResizeObserver(measure);
    observer.observe(document.body);

    const onResize = () => {
      measure();
      update();
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", onResize);
    };
  }, []);
}

/**
 * Builds one geometry holding the outlines of many boxes.
 *
 * Every box drawn as its own `lineSegments` would be a draw call each, and
 * the field wants enough of them to read as a volume. Baking the transforms
 * into a single buffer makes the whole layer one call; the layer then drifts
 * as a group, which is what gives the parallax between near and far.
 */
function useBoxFieldGeometry(specs: { position: THREE.Vector3; scale: THREE.Vector3; rotation: THREE.Euler }[]) {
  return useMemo(() => {
    const source = new THREE.EdgesGeometry(new THREE.BoxGeometry(1, 1, 1));
    const sourcePositions = source.getAttribute("position").array as ArrayLike<number>;
    const merged = new Float32Array(sourcePositions.length * specs.length);
    const matrix = new THREE.Matrix4();
    const vertex = new THREE.Vector3();

    specs.forEach((spec, index) => {
      matrix.compose(spec.position, new THREE.Quaternion().setFromEuler(spec.rotation), spec.scale);
      const offset = index * sourcePositions.length;
      for (let i = 0; i < sourcePositions.length; i += 3) {
        vertex.set(sourcePositions[i], sourcePositions[i + 1], sourcePositions[i + 2]).applyMatrix4(matrix);
        merged[offset + i] = vertex.x;
        merged[offset + i + 1] = vertex.y;
        merged[offset + i + 2] = vertex.z;
      }
    });

    source.dispose();
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(merged, 3));
    return geometry;
  }, [specs]);
}

/** A deterministic pseudo-random source, so the composition is identical on
 *  every load and two people comparing screens see the same world. */
function seeded(seed: number) {
  let value = seed;
  return () => {
    value = (value * 1664525 + 1013904223) % 4294967296;
    return value / 4294967296;
  };
}

function BoxLayer({
  count,
  seed,
  depth,
  spread,
  color,
  opacity,
  drift,
  still,
}: {
  count: number;
  seed: number;
  depth: [number, number];
  spread: number;
  color: string;
  opacity: number;
  drift: number;
  still: boolean;
}) {
  const specs = useMemo(() => {
    const random = seeded(seed);
    return Array.from({ length: count }, () => {
      const size = 0.5 + random() * 2.4;
      return {
        position: new THREE.Vector3(
          (random() - 0.5) * spread,
          (random() - 0.5) * spread * 0.62,
          depth[0] - random() * (depth[0] - depth[1]),
        ),
        scale: new THREE.Vector3(size * (0.8 + random() * 1.1), size * (0.55 + random() * 0.7), size * 0.7),
        rotation: new THREE.Euler(random() * Math.PI, random() * Math.PI, (random() - 0.5) * 0.9),
      };
    });
  }, [count, seed, depth, spread]);

  const geometry = useBoxFieldGeometry(specs);
  const ref = useRef<THREE.LineSegments>(null);

  useFrame((_, delta) => {
    if (!ref.current || still) return;
    ref.current.rotation.y += delta * drift;
    ref.current.rotation.x += delta * drift * 0.35;
  });

  useEffect(() => () => geometry.dispose(), [geometry]);

  return (
    <lineSegments ref={ref} geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={opacity} blending={THREE.AdditiveBlending} depthWrite={false} />
    </lineSegments>
  );
}

function ChromePlates({ still }: { still: boolean }) {
  const group = useRef<THREE.Group>(null);
  const plates = useMemo(() => {
    const random = seeded(9271);
    return Array.from({ length: 9 }, (_, index) => ({
      position: [(random() - 0.5) * 17, (random() - 0.5) * 10, 1 - random() * 22] as [number, number, number],
      rotation: [random() * Math.PI, random() * Math.PI, (random() - 0.5) * 1.2] as [number, number, number],
      size: 0.4 + random() * 1.15,
      spin: 0.04 + random() * 0.1,
      color: CHROME[index % CHROME.length],
    }));
  }, []);

  useFrame((_, delta) => {
    if (!group.current || still) return;
    group.current.children.forEach((child, index) => {
      child.rotation.x += delta * plates[index].spin * 0.4;
      child.rotation.y += delta * plates[index].spin;
    });
  });

  return (
    <group ref={group}>
      {plates.map((plate, index) => (
        <mesh key={index} position={plate.position} rotation={plate.rotation}>
          <boxGeometry args={[plate.size * 1.8, plate.size * 0.32, plate.size * 0.95]} />
          <meshStandardMaterial color={plate.color} metalness={0.92} roughness={0.2} envMapIntensity={1.9} />
        </mesh>
      ))}
    </group>
  );
}

function Motes({ count = 200 }: { count?: number }) {
  const positions = useMemo(() => {
    const random = seeded(4412);
    const values = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      values[i * 3] = (random() - 0.5) * 30;
      values[i * 3 + 1] = (random() - 0.5) * 18;
      values[i * 3 + 2] = 2 - random() * 32;
    }
    return values;
  }, [count]);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color={ICE}
        size={0.036}
        sizeAttenuation
        transparent
        opacity={0.75}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

/**
 * A soft additive halo, used to fake bloom.
 *
 * Real bloom needs a postprocessing pass, and the effect composer is a
 * dependency this project does not carry. A billboarded plane with a radial
 * falloff painted into a canvas texture, blended additively, gives the same
 * impression of light spilling off a bright object for the cost of one
 * transparent quad.
 */
function Glow({
  position,
  scale,
  color,
  opacity,
}: {
  position: [number, number, number];
  scale: number;
  color: string;
  opacity: number;
}) {
  const ref = useRef<THREE.Mesh>(null);

  const texture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
      gradient.addColorStop(0, "rgba(255,255,255,1)");
      gradient.addColorStop(0.35, "rgba(255,255,255,0.35)");
      gradient.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, size, size);
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);

  useEffect(() => () => texture.dispose(), [texture]);

  // Kept facing the camera so the halo never foreshortens into an ellipse.
  useFrame((state) => {
    if (ref.current) ref.current.quaternion.copy(state.camera.quaternion);
  });

  return (
    <mesh ref={ref} position={position} scale={scale}>
      <planeGeometry args={[1, 1]} />
      <meshBasicMaterial
        map={texture}
        color={color}
        transparent
        opacity={opacity}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        depthTest={false}
      />
    </mesh>
  );
}

/** The object the hero is composed around. It sits at the front of the world,
 *  so scrolling carries the camera past and beyond it. */
function CoreAssembly({ still }: { still: boolean }) {
  const ref = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (!ref.current || still) return;
    ref.current.rotation.y += delta * 0.11;
    ref.current.rotation.z += delta * 0.02;
    ref.current.position.x += (state.pointer.x * 0.5 + 2.4 - ref.current.position.x) * 0.02;
    ref.current.position.y += (-state.pointer.y * 0.28 - ref.current.position.y) * 0.02;
  });

  return (
    <group ref={ref} position={[2.4, 0, -3.6]}>
      {/* Sits behind the body so the silhouette reads against the fog rather
          than dissolving into it. */}
      <Glow position={[0, 0, -1.4]} scale={7.5} color={ICE} opacity={0.32} />
      <Glow position={[0.6, -0.4, -1.2]} scale={4.2} color={EMBER} opacity={0.22} />
      <mesh rotation={[0.4, 0.2, 0]}>
        <icosahedronGeometry args={[1.2, 1]} />
        <meshStandardMaterial color="#c8d0d6" metalness={0.96} roughness={0.16} envMapIntensity={2.2} />
      </mesh>
      <mesh rotation={[1.2, 0.25, 0.7]}>
        <torusGeometry args={[1.5, 0.042, 10, 90]} />
        <meshBasicMaterial color={ICE} transparent opacity={0.6} blending={THREE.AdditiveBlending} />
      </mesh>
      <mesh rotation={[0.3, 1.1, 1.8]}>
        <torusGeometry args={[1.76, 0.026, 8, 90]} />
        <meshBasicMaterial color={EMBER} transparent opacity={0.4} blending={THREE.AdditiveBlending} />
      </mesh>
    </group>
  );
}

/**
 * Gives the metal something to reflect.
 *
 * These surfaces are near-perfect chrome, and in physically based rendering a
 * fully metallic surface has no diffuse response - everything visible on it is
 * reflected environment. Without one assigned they render black, which is
 * exactly how the old hero scene looked. This builds a small studio from the
 * site's own palette and pre-filters it once.
 */
function PaletteEnvironment() {
  const gl = useThree((state) => state.gl);
  const scene = useThree((state) => state.scene);

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color("#0b0d10");

    const panel = (color: string, intensity: number, size: [number, number], position: [number, number, number]) => {
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(size[0], size[1]),
        new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide }),
      );
      mesh.position.set(...position);
      mesh.lookAt(0, 0, 0);
      envScene.add(mesh);
    };

    panel("#f4fbff", 3.6, [9, 9], [-5, 6, 4]);
    panel(ICE, 2.3, [8, 5], [6, 1, 3]);
    panel(EMBER, 1.3, [7, 4], [-5, -3, 1]);
    panel("#1b2026", 1, [16, 16], [0, -7, 0]);

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

/**
 * Flies the camera through the world as the document scrolls, and warms the
 * fog toward amber on the way down.
 *
 * The colour shift is the site's own rule made spatial: pale blue is the
 * computer-vision work at the top of the page, amber is the civic work, and
 * the world itself crosses between them rather than the accent being applied
 * per card.
 */
function ScrollRig({ still }: { still: boolean }) {
  const { camera, scene } = useThree();
  const fog = useMemo(() => new THREE.FogExp2("#05070a", 0.055), []);
  const cool = useMemo(() => new THREE.Color("#05070a"), []);
  const warm = useMemo(() => new THREE.Color("#120a08"), []);
  const eased = useRef(0);

  useEffect(() => {
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [scene, fog]);

  useFrame((state) => {
    // Chase the raw scroll value rather than snapping to it, so a flick of the
    // wheel reads as the camera taking a moment to follow.
    eased.current += (scroll.progress - eased.current) * 0.055;
    const progress = still ? 0 : eased.current;

    camera.position.z = 7.4 - progress * DOLLY_DEPTH;
    camera.position.x = still ? 0 : state.pointer.x * 0.42 + Math.sin(progress * 3.1) * 0.7;
    camera.position.y = still ? 0 : -state.pointer.y * 0.26 + Math.cos(progress * 2.4) * 0.45;
    camera.lookAt(0, 0, camera.position.z - 6);

    fog.color.copy(cool).lerp(warm, progress);
    fog.density = 0.055 - progress * 0.016;
  });

  return null;
}

/**
 * Watches the real frame rate and gives quality back until the page is smooth.
 *
 * What this scene costs depends entirely on hardware that cannot be known in
 * advance - an integrated GPU pushing a 4K panel is a different machine from a
 * discrete one at 1080p, and picking a single quality level for both means
 * either wasting the fast machine or stuttering on the slow one. So it
 * measures: sustained time under target drops the render scale a step, and if
 * even the lowest step cannot hold a reasonable rate the scene bows out
 * entirely and the CSS instrument graphics carry the page on their own.
 *
 * Steps are one-way. Quality that oscillates as the average crosses the
 * threshold is more distracting than quality that is simply lower.
 */
const DPR_STEPS = [1.25, 1, 0.75];

function AdaptiveQuality({ onGiveUp }: { onGiveUp: () => void }) {
  const setDpr = useThree((state) => state.setDpr);
  const step = useRef(0);
  const frames = useRef(0);
  const windowStart = useRef(0);
  const slowWindows = useRef(0);

  useFrame(() => {
    const now = performance.now();
    if (windowStart.current === 0) {
      windowStart.current = now;
      return;
    }

    frames.current += 1;
    const elapsed = now - windowStart.current;
    if (elapsed < 1000) return;

    const fps = (frames.current * 1000) / elapsed;
    frames.current = 0;
    windowStart.current = now;

    // One slow second is a garbage collection or a chunk arriving, not a slow
    // machine. Three in a row is a verdict.
    if (fps >= 45) {
      slowWindows.current = 0;
      return;
    }
    slowWindows.current += 1;
    if (slowWindows.current < 3) return;

    slowWindows.current = 0;
    if (step.current < DPR_STEPS.length - 1) {
      step.current += 1;
      setDpr(DPR_STEPS[step.current]);
    } else {
      onGiveUp();
    }
  });

  return null;
}

function SceneContent({ still, onGiveUp }: { still: boolean; onGiveUp: () => void }) {
  return (
    <>
      <AdaptiveQuality onGiveUp={onGiveUp} />
      <PaletteEnvironment />
      <ScrollRig still={still} />
      {/* Three lights, not six. Each one multiplies the fragment cost of every
          metal surface in the scene, and the environment map below is already
          doing most of the lighting work - the chrome reads from what it
          reflects, not from how many lamps are pointed at it. */}
      <ambientLight intensity={0.4} />
      <directionalLight position={[-3, 4, 5]} intensity={2.2} color="#f4fbff" />
      <pointLight position={[3.4, 1.6, -7]} intensity={24} distance={13} color="#ffffff" />

      <CoreAssembly still={still} />
      <ChromePlates still={still} />
      <Motes />

      {/* Pools of light further down the tunnel, so the scroll passes through
          atmosphere instead of uniformly dark space. */}
      <Glow position={[-6, 2, -12]} scale={16} color={ICE} opacity={0.12} />
      <Glow position={[5, -3, -20]} scale={20} color={EMBER} opacity={0.11} />
      <Glow position={[-2, 1, -28]} scale={18} color={ICE} opacity={0.09} />

      {/* Three depth layers. The near one moves most, which is what produces
          the parallax as the camera travels. */}
      <BoxLayer count={14} seed={101} depth={[0, -7]} spread={20} color={ICE} opacity={0.55} drift={0.035} still={still} />
      <BoxLayer count={22} seed={202} depth={[-8, -18]} spread={26} color={ICE} opacity={0.36} drift={0.02} still={still} />
      <BoxLayer count={10} seed={404} depth={[-6, -16]} spread={24} color={EMBER} opacity={0.3} drift={-0.026} still={still} />
      <BoxLayer count={26} seed={303} depth={[-18, -32]} spread={32} color={EMBER} opacity={0.26} drift={0.012} still={still} />
    </>
  );
}

export function SceneBackdrop() {
  const reduced = useReducedMotion();
  const [enabled, setEnabled] = useState(false);
  // Latched, never reset: a machine that could not hold a frame rate a minute
  // ago will not have got faster, and re-mounting to find out would cost
  // another stutter.
  const [tooSlow, setTooSlow] = useState(false);
  useScrollProgress();

  useEffect(() => {
    if (reduced) {
      setEnabled(false);
      return;
    }
    // A phone gets the CSS instrument graphics and no WebGL at all: the cost
    // is not worth it on a small screen, and `hover: none` is a better proxy
    // for "this is a phone" than width alone.
    const media = window.matchMedia("(min-width: 768px) and (hover: hover)");
    if (!media.matches) {
      setEnabled(false);
      return;
    }
    // Let the readable page, the fonts and the content request settle first.
    const timeout = window.setTimeout(() => setEnabled(true), 700);
    return () => window.clearTimeout(timeout);
  }, [reduced]);

  if (!enabled || tooSlow) return null;

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
      <Canvas
        dpr={[1, 1.25]}
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
        camera={{ position: [0, 0, 7.4], fov: 52, near: 0.1, far: 60 }}
      >
        <SceneContent still={false} onGiveUp={() => setTooSlow(true)} />
      </Canvas>
      {/* Holds the world back behind the type. Without it the wireframes cross
          body copy at full strength and the page stops being readable. */}
      <div className="absolute inset-0 bg-ink-950/38" />
    </div>
  );
}
