import React, { useRef, useEffect } from 'react';
import * as THREE from 'three';

interface ThreeBackgroundProps {
  className?: string;
}

const ThreeBackground: React.FC<ThreeBackgroundProps> = ({ className = '' }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const animationIdRef = useRef<number>();

  useEffect(() => {
    if (!mountRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      alpha: true, 
      antialias: true 
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setClearColor(0x000000, 0); // Transparent background
    rendererRef.current = renderer;
    mountRef.current.appendChild(renderer.domElement);

    // Create floating geometric shapes
    const geometries = [
      new THREE.BoxGeometry(0.2, 0.2, 0.2),
      new THREE.SphereGeometry(0.1, 8, 6),
      new THREE.ConeGeometry(0.1, 0.3, 6),
      new THREE.OctahedronGeometry(0.15),
    ];

    const materials = [
      new THREE.MeshBasicMaterial({ 
        color: 0x3b82f6, 
        transparent: true, 
        opacity: 0.1 
      }),
      new THREE.MeshBasicMaterial({ 
        color: 0x10b981, 
        transparent: true, 
        opacity: 0.1 
      }),
      new THREE.MeshBasicMaterial({ 
        color: 0x8b5cf6, 
        transparent: true, 
        opacity: 0.1 
      }),
      new THREE.MeshBasicMaterial({ 
        color: 0xf59e0b, 
        transparent: true, 
        opacity: 0.1 
      }),
    ];

    const meshes: THREE.Mesh[] = [];

    // Create 15 floating shapes
    for (let i = 0; i < 15; i++) {
      const geometry = geometries[Math.floor(Math.random() * geometries.length)];
      const material = materials[Math.floor(Math.random() * materials.length)];
      const mesh = new THREE.Mesh(geometry, material);

      // Random positioning
      mesh.position.x = (Math.random() - 0.5) * 10;
      mesh.position.y = (Math.random() - 0.5) * 10;
      mesh.position.z = (Math.random() - 0.5) * 5;

      // Random rotation
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;

      // Store initial position for floating animation
      (mesh as any).initialY = mesh.position.y;
      (mesh as any).floatSpeed = 0.01 + Math.random() * 0.02;
      (mesh as any).rotationSpeed = {
        x: (Math.random() - 0.5) * 0.02,
        y: (Math.random() - 0.5) * 0.02,
        z: (Math.random() - 0.5) * 0.02,
      };

      scene.add(mesh);
      meshes.push(mesh);
    }

    // Animation loop
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      // Animate each mesh
      meshes.forEach((mesh, index) => {
        // Floating animation
        mesh.position.y = (mesh as any).initialY + Math.sin(Date.now() * (mesh as any).floatSpeed + index) * 0.5;
        
        // Rotation animation
        mesh.rotation.x += (mesh as any).rotationSpeed.x;
        mesh.rotation.y += (mesh as any).rotationSpeed.y;
        mesh.rotation.z += (mesh as any).rotationSpeed.z;
      });

      renderer.render(scene, camera);
    };

    animate();

    // Handle resize
    const handleResize = () => {
      if (!mountRef.current || !renderer) return;
      
      const width = mountRef.current.clientWidth;
      const height = mountRef.current.clientHeight;
      
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    window.addEventListener('resize', handleResize);

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }
      
      // Dispose of Three.js objects
      geometries.forEach(geometry => geometry.dispose());
      materials.forEach(material => material.dispose());
      renderer.dispose();
    };
  }, []);

  return (
    <div 
      ref={mountRef} 
      className={`absolute inset-0 pointer-events-none ${className}`}
      style={{ zIndex: -1 }}
    />
  );
};

export default ThreeBackground;
