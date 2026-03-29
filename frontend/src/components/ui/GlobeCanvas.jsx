import React, { useRef, Suspense, useMemo } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { TextureLoader, BackSide } from 'three';
import { useLanguage } from '../../context/LanguageContext';

const EarthMesh = () => {
  const earthRef = useRef();
  const cloudsRef = useRef();
  const mouseRef = useRef({ x: 0, y: 0 });

  const [earthTex, cloudsTex] = useLoader(TextureLoader, [
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_atmos_2048.jpg',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
  ]);

  React.useEffect(() => {
    const handleMouseMove = (e) => {
      mouseRef.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
      mouseRef.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  useFrame(() => {
    if (earthRef.current && cloudsRef.current) {
      earthRef.current.rotation.y += 0.0015;
      cloudsRef.current.rotation.y += 0.0020;
      
      earthRef.current.rotation.x += (mouseRef.current.y * 0.15 - earthRef.current.rotation.x) * 0.05;
      earthRef.current.rotation.z += (mouseRef.current.x * -0.08 - earthRef.current.rotation.z) * 0.05;
      
      cloudsRef.current.rotation.x = earthRef.current.rotation.x;
      cloudsRef.current.rotation.z = earthRef.current.rotation.z;
    }
  });

  return (
    <group>
      <mesh scale={1.06}>
        <sphereGeometry args={[2, 32, 32]} />
        <meshPhongMaterial color="#52B788" transparent opacity={0.07} side={BackSide} />
      </mesh>
      
      <mesh ref={cloudsRef}>
        <sphereGeometry args={[2.03, 64, 64]} />
        <meshPhongMaterial map={cloudsTex} transparent opacity={0.3} depthWrite={false} />
      </mesh>
      
      <mesh ref={earthRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <meshStandardMaterial
          map={earthTex}
          roughness={0.62}
          metalness={0.2}
          emissive="#244b3a"
          emissiveIntensity={0.22}
        />
      </mesh>
    </group>
  );
};

export default function GlobeCanvas() {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-[500px] flex items-center justify-center">
      <Suspense fallback={<div className="w-full h-full bg-farm-pale/30 rounded-3xl animate-pulse" />}>
        <Canvas camera={{ position: [0, 0, 6], fov: 45 }} className="w-full h-full cursor-pointer" gl={{ antialias: true, alpha: true }}>
          <ambientLight intensity={0.75} />
          <directionalLight position={[5, 3, 5]} intensity={2.25} color="#fff7d6" />
          <pointLight position={[-10, -5, -10]} intensity={0.6} color="#1e40af" />
          <pointLight position={[0, 4, 6]} intensity={1.0} color="#ffffff" />
          <EarthMesh />
        </Canvas>
      </Suspense>
      
      <div className="absolute -bottom-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-md border border-farm-pale flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-farm-green animate-pulse"></div>
        <span className="font-body text-sm text-farm-green">{t('hero.globeLabel')}</span>
      </div>
    </div>
  );
}
