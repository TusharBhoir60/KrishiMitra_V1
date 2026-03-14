import React, { useRef, Suspense } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { Html, Stars } from '@react-three/drei';
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

  const cities = [
    { name: 'Mumbai', lat: 19.076, lng: 72.877 },
    { name: 'Pune', lat: 18.520, lng: 73.856 },
    { name: 'Delhi', lat: 28.613, lng: 77.209 },
    { name: 'Bengaluru', lat: 12.972, lng: 77.594 },
    { name: 'Hyderabad', lat: 17.385, lng: 78.487 },
    { name: 'Kolkata', lat: 22.572, lng: 88.363 },
    { name: 'Chennai', lat: 13.083, lng: 80.270 },
    { name: 'Ahmedabad', lat: 23.022, lng: 72.571 }
  ];

  const r = 2.05;

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
        <meshStandardMaterial map={earthTex} roughness={0.8} metalness={0.1} />
        
        {cities.map((city, idx) => {
          const phi = (90 - city.lat) * (Math.PI / 180);
          const theta = (city.lng + 180) * (Math.PI / 180);
          const x = -(r * Math.sin(phi) * Math.cos(theta));
          const y = r * Math.cos(phi);
          const z = -(r * Math.sin(phi) * Math.sin(theta));

          return (
            <Html key={idx} position={[x, y, z]} distanceFactor={8}>
              <div className="relative flex justify-center items-center">
                <div className="absolute w-4 h-4 bg-yellow-400/40 rounded-full animate-ping"></div>
                <div className="w-2 h-2 bg-yellow-400 rounded-full shadow-[0_0_6px_#F59E0B]"></div>
              </div>
            </Html>
          );
        })}
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
          <ambientLight intensity={0.4} />
          <directionalLight position={[5, 3, 5]} intensity={1.8} color="#fff5e0" />
          <pointLight position={[-10, -5, -10]} intensity={0.3} color="#1e40af" />
          <Stars radius={100} depth={50} count={1500} factor={4} fade speed={0.3} />
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
