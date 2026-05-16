'use client';
import { useState, useEffect } from 'react';
import gsap from 'gsap';

const TEXTS = [
    "POWERED BY PROSKILL GLOBAL SOLUTION",
    "WORKFORCE INFRASTRUCTURE",
    "ENTERPRISE AUTOMATION",
    "CONNECTED TO THE FUTURE",
    "HUMAN + AI ECOSYSTEM"
];

export default function EndingOverlay() {
    const [currentTextIndex, setCurrentTextIndex] = useState(0);

    useEffect(() => {
        gsap.fromTo('.ending-overlay', 
            { opacity: 0, scale: 0.9 },
            { opacity: 1, scale: 1, duration: 2 }
        );

        const interval = setInterval(() => {
            gsap.to('.secondary-text', {
                opacity: 0,
                y: -10,
                duration: 0.5,
                onComplete: () => {
                    setCurrentTextIndex((prev) => (prev + 1) % TEXTS.length);
                    gsap.fromTo('.secondary-text', 
                        { opacity: 0, y: 10 },
                        { opacity: 1, y: 0, duration: 0.5 }
                    );
                }
            });
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="flex flex-col items-center justify-center ending-overlay opacity-0 gap-6 text-center">
            <style jsx>{`
                @keyframes shimmer {
                    0% { transform: translateX(-100%); }
                    100% { transform: translateX(100%); }
                }
                .animate-shimmer {
                    animation: shimmer 2s infinite linear;
                }
            `}</style>
            
            <div className="w-full max-w-md mb-4 -mt-32">
                <div className="flex justify-between text-[#00ffff] font-mono text-xs mb-2 tracking-widest">
                  <span>SYSTEM UPLOAD</span>
                  <span>86%</span>
                </div>
                <div className="relative h-4 w-full bg-black/80 border border-[#00ffff]/30 rounded-lg overflow-hidden shadow-[0_0_15px_rgba(0,255,255,0.3)]">
                  <div 
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-[#00ffff]/20 via-[#00ffff]/80 to-[#00ffff]/20 shadow-[0_0_30px_rgba(0,255,255,0.6)]"
                    style={{ width: '86%' }}
                  >
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent,rgba(255,255,255,0.4),transparent)] animate-shimmer" />
                  </div>
                </div>
            </div>

            <h1 className="text-7xl font-bold tracking-[0.2em] text-white holographic-text">
                GUGAN ECOSYSTEM ONLINE
            </h1>
            <p className="text-2xl tracking-[0.5em] text-[#00ffff] uppercase secondary-text">
                {TEXTS[currentTextIndex]}
            </p>
        </div>
    );
}
