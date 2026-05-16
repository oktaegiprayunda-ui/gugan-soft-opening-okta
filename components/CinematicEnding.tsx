'use client';

import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function CinematicEnding({ scene, active }: { scene: THREE.Scene; active: boolean }) {
  const groupRef = useRef<THREE.Group>(new THREE.Group());
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    
    const group = groupRef.current;
    scene.add(group);

    // Neural Nodes (Floating particles)
    const nodeGeometry = new THREE.BufferGeometry();
    const nodeCount = 300;
    const pos = new Float32Array(nodeCount * 3);
    for(let i=0; i<nodeCount*3; i++) pos[i] = (Math.random()-0.5)*30;
    nodeGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const nodes = new THREE.Points(nodeGeometry, new THREE.PointsMaterial({
        size: 0.1, color: 0xffffff, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending
    }));
    group.add(nodes);

    // Neural Network Lines
    const lineMaterial = new THREE.LineBasicMaterial({ color: 0x00ffff, transparent: true, opacity: 0.1 });
    const lineGroup = new THREE.Group();
    group.add(lineGroup);
    
    for (let i = 0; i < 20; i++) {
        const geometry = new THREE.BufferGeometry();
        const p1 = new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*20);
        const p2 = new THREE.Vector3((Math.random()-0.5)*20, (Math.random()-0.5)*20, (Math.random()-0.5)*20);
        geometry.setFromPoints([p1, p2]);
        lineGroup.add(new THREE.Line(geometry, lineMaterial));
    }

    const animate = (time: number = 0) => {
        group.rotation.y = Math.sin(time * 0.0001) * 0.1;
        group.rotation.x = Math.cos(time * 0.0001) * 0.05;
        
        nodes.rotation.y += 0.001;
        lineGroup.children.forEach((child, i) => {
            child.rotation.y = Math.sin(time * 0.0005 + i) * 0.1;
        });

        rafRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => {
        cancelAnimationFrame(rafRef.current);
        scene.remove(group);
        group.clear();
        lineGroup.clear();
    };
  }, [active, scene]);

  return null;
}
