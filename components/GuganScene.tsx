'use client';

import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import MotherboardWorld from './MotherboardWorld';
import CinematicEnding from './CinematicEnding';
import EndingOverlay from './EndingOverlay';
import { AudioSystem } from '@/lib/audio';

export default function GuganScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const lookAtRef = useRef(new THREE.Vector3(0, 0, 0));
  const audioRef = useRef<AudioSystem>(new AudioSystem());
  const [scene, setScene] = useState<THREE.Scene | null>(null);
  const [sceneState, setSceneState] = useState('blackIntro');
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (!mountRef.current) return;

    const newScene = new THREE.Scene();
    sceneRef.current = newScene;
    setScene(newScene);
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 0, 5);
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    mountRef.current.appendChild(renderer.domElement);

    // Bloom Post-processing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(newScene, camera));
    const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        1.5, // strength
        0.4, // radius
        0.85 // threshold
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    const resizeObserver = new ResizeObserver(() => {
        if (cameraRef.current && renderer) {
            cameraRef.current.aspect = window.innerWidth / window.innerHeight;
            cameraRef.current.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
            composer.setSize(window.innerWidth, window.innerHeight);
        }
    });
    resizeObserver.observe(mountRef.current);

    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1500;
    const pos = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) pos[i] = (Math.random() - 0.5) * 20;
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const particles = new THREE.Points(particleGeometry, new THREE.PointsMaterial({ size: 0.015, color: 0x88ccff, transparent: true, opacity: 0.5 }));
    newScene.add(particles);

    const animate = () => {
      requestAnimationFrame(animate);
      if (cameraRef.current) cameraRef.current.lookAt(lookAtRef.current);
      particles.rotation.y += 0.0002;
      composerRef.current?.render();
    };
    animate();

    const tl = gsap.timeline();
    tl.to('#intro-text', { opacity: 1, duration: 2 })
      .to('#intro-text', { opacity: 0, duration: 1, delay: 1 })
      .call(() => setSceneState('activation'));

    return () => {
      resizeObserver.disconnect();
      composerRef.current?.dispose();
      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  useEffect(() => {
    if (sceneState === 'motherboard') {
        const runCountdown = async () => {
            for (let i = 10; i > 0; i--) {
                gsap.fromTo('#countdown-display', 
                    { scale: 0.5, opacity: 0, textShadow: '0 0 0px #00aaff' }, 
                    { scale: 1, opacity: 1, textShadow: '0 0 50px #00aaff', duration: 0.3, ease: 'power2.out' }
                );
                gsap.to('.grid-overlay', { backgroundSize: '20px 20px', duration: 0.1, yoyo: true, repeat: 1 });
                audioRef.current.playCountdownPulse();
                setCountdown(i);
                await new Promise(r => setTimeout(r, 1000));
            }
            setSceneState('reveal');
        };
        runCountdown();
    }
    if (sceneState === 'reveal') {
        audioRef.current.playRevealBoom();
        gsap.fromTo('.reveal-logo', 
            { opacity: 0, y: 50, scale: 0.9 },
            { opacity: 1, y: 0, scale: 1, duration: 2.5, ease: 'power4.out' }
        );
        setTimeout(() => {
            setSceneState('ending1');
        }, 3000);
    }
    if (sceneState === 'ending1') {
        // Handled in EndingOverlay
    }
  }, [sceneState]);

  useEffect(() => {
    if (sceneState === 'launch') {
        const earth = new THREE.Mesh(new THREE.SphereGeometry(10, 32, 32), new THREE.MeshBasicMaterial({ color: 0x0000ff }));
        earth.position.set(0, 40, 0);
        sceneRef.current?.add(earth);
        
        const sat = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ color: 0xffffff }));
        sat.position.set(0, 45, 0);
        sceneRef.current?.add(sat);

        if (cameraRef.current) {
            gsap.to(cameraRef.current.position, { 
                y: 50, z: 0,
                duration: 6, 
                ease: 'power2.inOut' 
            });
            gsap.to(lookAtRef.current, { 
                y: 50, 
                duration: 6, 
                ease: 'power2.inOut' 
            });
        }
    }
  }, [sceneState]);

  const handleActivate = () => {
    audioRef.current.init();
    audioRef.current.playAmbientHum();
    audioRef.current.playClick();
    setSceneState('transitioning');
    gsap.to('#activation-screen', { opacity: 0, duration: 0.5 });
    
    if (cameraRef.current) {
        // Dramatic camera dolly
        gsap.to(cameraRef.current.position, { 
            x: 2, y: 1, z: 8, 
            duration: 4, 
            ease: 'expo.inOut' 
        });
        
        // Target focus shift
        gsap.to(lookAtRef.current, { 
            x: -1, y: 0.5, z: 0, 
            duration: 4, 
            ease: 'expo.inOut',
            onComplete: () => {
                setSceneState('motherboard');
            }
        });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#050505] p-10 flex flex-col justify-between box-sizing">
      <div className="grid-overlay"></div>
      <div className="vignette"></div>
      
      {/* Top Bar */}
      <div className="flex justify-between items-center z-10 w-full">
        <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjV5LU7vfsxrUb14tvSlqEKFR3tX3_seQ5SnzrjgNlcaaePtUoE9i0etHLTtW9zC6soaItM7cYkJ-YjA7Bfsg4r6flnn17pkWk3ZOCeH469BcC-f1B9HU0Gdn8UvDl2nQXmHeJyJ29x7K2m2Hrez5nWVurgYoi7mvnwIwZIP7ElMUhRnUzfM1fem-XmFqU/s0/Gugan%20Logo.png" width={300} height={90} alt="GUGAN" quality={100} className="object-contain" />
        <div className="text-[10px] text-[#444] font-mono uppercase text-right">
            ENTERPRISE AI LAYER // v4.0.2<br/>
            SECURE HANDSHAKE: PENDING<br/>
            COORDINATES: 37.7749° N, 122.4194° W
        </div>
      </div>

      <div ref={mountRef} className="absolute inset-0 z-0" />
      {scene && <MotherboardWorld scene={scene} active={sceneState === 'motherboard'} />}
      {scene && <CinematicEnding scene={scene} active={sceneState === 'ending1'} />}
      
      <div className="main-stage flex flex-1 flex-col items-center justify-center relative z-10">
        {sceneState === 'blackIntro' && (
          <div id="intro-text" className="text-xl tracking-[0.5em] opacity-0 uppercase">
            Initializing GUGAN Ecosystem
          </div>
        )}
        
        {sceneState === 'activation' && (
          <div id="activation-screen" className="flex items-center justify-center">
              <div className="w-80 h-80 rounded-full border border-white/10 flex items-center justify-center relative shadow-[0_0_60px_rgba(255,255,255,0.02)]">
                  <div className="w-60 h-60 rounded-full border border-white/40 flex items-center justify-center bg-[radial-gradient(circle,rgba(255,255,255,0.05)_0%,transparent_70%)]">
                      <button 
                          onClick={handleActivate}
                          className="px-8 py-4 bg-transparent text-xs tracking-[0.8em] uppercase cursor-pointer text-white"
                      >
                          ACTIVATE
                      </button>
                  </div>
              </div>
          </div>
        )}

        {sceneState === 'motherboard' && (
          <div id="countdown-display" className="text-9xl font-bold tracking-tighter text-white">
              {countdown}
          </div>
        )}

        {sceneState === 'reveal' && (
          <div className="flex flex-col items-center reveal-logo opacity-0">
              <Image src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjV5LU7vfsxrUb14tvSlqEKFR3tX3_seQ5SnzrjgNlcaaePtUoE9i0etHLTtW9zC6soaItM7cYkJ-YjA7Bfsg4r6flnn17pkWk3ZOCeH469BcC-f1B9HU0Gdn8UvDl2nQXmHeJyJ29x7K2m2Hrez5nWVurgYoi7mvnwIwZIP7ElMUhRnUzfM1fem-XmFqU/s0/Gugan%20Logo.png" width={800} height={240} alt="GUGAN" quality={100} priority className="object-contain" />
              <div className="text-xl tracking-[0.5em] text-[#888] mt-6 uppercase">THE FUTURE OF HR ECOSYSTEM</div>
              <div className="text-lg tracking-[0.3em] text-[#444] mt-2 uppercase">POWERED BY AI</div>
              <div className="text-base tracking-[0.2em] text-[#333] mt-2 uppercase">GUGAN 2026</div>
          </div>
        )}

        {sceneState === 'ending1' && (
          <EndingOverlay />
        )}
      </div>

      {/* Nav & Log */}
      <div className="z-10 flex gap-5 items-center pb-5">
        {['INTRO', 'CORE', 'TRANSIT', 'GRID', 'FINAL'].map((step, idx) => (
            <div key={step} className={`flex flex-col gap-2 w-32 ${idx === (sceneState === 'blackIntro' ? 0 : sceneState === 'activation' ? 1 : 3) ? 'opacity-100' : 'opacity-40'}`}>
                <div className="text-[10px] font-mono border-b border-[#333] pb-1">0{idx+1}. {step}</div>
            </div>
        ))}
      </div>
      
      <div className="absolute bottom-10 right-10 z-10 text-[9px] font-mono text-[#333] text-right">
        SYSTEM LOAD: 12.4%<br/>
        NEURAL NODES: 8,192 ACTIVE<br/>
        LATENCY: 0.002MS
      </div>
    </div>
  );
}
