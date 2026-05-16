'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function MotherboardWorld({ scene, active }: { scene: THREE.Scene; active: boolean }) {
  const frameRef = useRef<number>(0);
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const energyBeams = useRef<THREE.Points[]>([]);

  useEffect(() => {
    if (!active) return;
    
    const group = groupRef.current;
    scene.add(group);
    
    // Core
    const core = new THREE.Mesh(
        new THREE.IcosahedronGeometry(0.5, 2),
        new THREE.MeshStandardMaterial({ color: 0x00ffff, emissive: 0x00ffff, emissiveIntensity: 2 })
    );
    group.add(core);

    // Light
    const pointLight = new THREE.PointLight(0x00ffff, 10, 10);
    group.add(pointLight);

    // Circuits
    const circuits: THREE.Line[] = [];
    for (let i = 0; i < 40; i++) {
        const path = new THREE.CatmullRomCurve3([
            new THREE.Vector3(0, 0, 0),
            new THREE.Vector3((Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 8),
            new THREE.Vector3((Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15, (Math.random() - 0.5) * 15),
        ]);
        const geometry = new THREE.BufferGeometry().setFromPoints(path.getPoints(50));
        const material = new THREE.LineBasicMaterial({ color: 0x00aaff, transparent: true, opacity: 0.5 });
        const line = new THREE.Line(geometry, material);
        group.add(line);
        circuits.push(line);
    }

    // Energy Streams
    const particleGeometry = new THREE.BufferGeometry();
    const count = 500;
    const pos = new Float32Array(count * 3);
    for(let i=0; i<count*3; i++) pos[i] = (Math.random()-0.5)*20;
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const energySystem = new THREE.Points(particleGeometry, new THREE.PointsMaterial({
        size: 0.05, color: 0x00ffff, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending
    }));
    group.add(energySystem);

    const animate = (time: number = 0) => {
        core.rotation.y += 0.01;
        
        // Flowing energy effect
        const positions = energySystem.geometry.attributes.position.array as Float32Array;
        for(let i=0; i<positions.length; i+=3) {
            positions[i+1] += Math.sin(time * 0.001 + positions[i]) * 0.02; // Simple flow
        }
        energySystem.geometry.attributes.position.needsUpdate = true;
        
        frameRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
        cancelAnimationFrame(frameRef.current);
        scene.remove(group);
        group.clear();
    };
  }, [active, scene]);

  return null;
}
