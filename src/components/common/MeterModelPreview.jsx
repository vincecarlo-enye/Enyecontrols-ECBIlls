import { Suspense, useMemo, useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Bounds, Center, OrbitControls, useGLTF } from '@react-three/drei'

function MeterModel({ src, rotation = [0, 0, 0] }) {
  const group = useRef(null)
  const { scene } = useGLTF(src)
  const clonedScene = useMemo(() => scene.clone(true), [scene])

  useFrame((state) => {
    if (!group.current) return
    group.current.rotation.y = rotation[1] + Math.sin(state.clock.elapsedTime * 0.9) * 0.08
  })

  return (
    <group ref={group} rotation={rotation}>
      <Center>
        <primitive object={clonedScene} />
      </Center>
    </group>
  )
}

export default function MeterModelPreview({ src, label, rotation, fitMargin = 0.72 }) {
  return (
    <div className="absolute inset-0">
      <Canvas
        camera={{ position: [0, 0.35, 3.4], fov: 34 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
        aria-label={label}
      >
        <ambientLight intensity={1.6} />
        <directionalLight position={[2.5, 4, 4]} intensity={2.4} />
        <directionalLight position={[-3, 1.5, -2]} intensity={0.9} />
        <Suspense fallback={null}>
          <Bounds fit clip observe margin={fitMargin}>
            <MeterModel src={src} rotation={rotation} />
          </Bounds>
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} autoRotate autoRotateSpeed={0.45} />
      </Canvas>
    </div>
  )
}
