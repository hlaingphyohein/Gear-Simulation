import React, { useState, useEffect, useRef } from 'react';
import { DesignResult } from '../types';
import { generateGearPath } from '../services/gearMath';
import { Download, ZoomIn, ZoomOut, Maximize } from 'lucide-react';
import { downloadDXF } from '../services/dxfExporter';

interface Props {
  design: DesignResult;
  isRunning: boolean;
  simulationTime: number;
}

const GearVisualizer: React.FC<Props> = ({ design, isRunning, simulationTime }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoom, setZoom] = useState(1);
  
  // Reset zoom when design substantially changes (e.g. ratio change)
  useEffect(() => {
    setZoom(1);
  }, [design.ratio, design.centerDistance]);

  // Rotational state based on simulation time
  // Pinion Angle = RPM * 360/60 * time
  const pinionAngle = (design.pinion.rpm / 60) * 360 * simulationTime; 
  // Gear Angle = - PinionAngle / Ratio (Negative because it meshes and turns opposite)
  const gearAngle = -pinionAngle / design.ratio;

  // Generate paths
  const pinionPath = generateGearPath(design.pinion.teeth, design.pinion.module);
  const gearPath = generateGearPath(design.gear.teeth, design.gear.module);

  // --- PRECISE BOUNDING BOX CALCULATION ---
  // Pinion Center: (0,0)
  // Gear Center: (centerDistance, 0)
  const rPinion = design.pinion.diameter / 2;
  const rGear = design.gear.diameter / 2;
  const maxR = Math.max(rPinion, rGear);

  // Add margin relative to the size of the gears (10% or at least 2 modules)
  const margin = Math.max(design.pinion.module * 2, design.centerDistance * 0.1);

  // Bounding box coordinates
  const minX = -rPinion - margin;
  const maxX = design.centerDistance + rGear + margin;
  const minY = -maxR - margin;
  const maxY = maxR + margin;

  const baseWidth = maxX - minX;
  const baseHeight = maxY - minY;

  // Apply Zoom: We scale the ViewBox dimensions inversely to zoom level
  const viewWidth = baseWidth / zoom;
  const viewHeight = baseHeight / zoom;
  
  // Center the zoomed view
  const viewX = minX + (baseWidth - viewWidth) / 2;
  const viewY = minY + (baseHeight - viewHeight) / 2;

  const viewbox = `${viewX} ${viewY} ${viewWidth} ${viewHeight}`;

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden border border-slate-700 relative flex flex-col h-full shadow-inner group">
      
      {/* HUD: Info */}
      <div className="absolute top-4 left-4 z-10 pointer-events-none">
         <div className="bg-slate-900/90 backdrop-blur px-3 py-2 rounded border border-slate-700 shadow-lg">
           <h3 className="text-slate-200 font-mono text-xs font-bold tracking-wider text-emerald-400">KINEMATIC VIEW</h3>
           <div className="text-[10px] text-slate-400 mt-1 space-y-0.5">
              <div>CD: <span className="text-white font-mono">{design.centerDistance.toFixed(2)} mm</span></div>
              <div>Module: <span className="text-white font-mono">{design.pinion.module}</span></div>
           </div>
         </div>
      </div>

      {/* HUD: Controls */}
      <div className="absolute top-4 right-4 z-10 flex flex-col items-end gap-2">
         {/* Export Buttons */}
         <div className="flex gap-2">
            <button 
              onClick={() => downloadDXF(design.pinion, "Pinion")}
              className="bg-blue-600/90 hover:bg-blue-500 p-1.5 rounded text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur shadow transition-all hover:scale-105"
              title="Download Pinion DXF"
            >
                <Download size={12} /> P.DXF
            </button>
            <button 
              onClick={() => downloadDXF(design.gear, "Gear")}
              className="bg-blue-600/90 hover:bg-blue-500 p-1.5 rounded text-white text-[10px] font-bold flex items-center gap-1 backdrop-blur shadow transition-all hover:scale-105"
              title="Download Gear DXF"
            >
                <Download size={12} /> G.DXF
            </button>
         </div>

         {/* Zoom Controls */}
         <div className="flex flex-col bg-slate-800/90 backdrop-blur rounded border border-slate-600 shadow-lg overflow-hidden mt-2">
            <button 
               onClick={() => setZoom(z => Math.min(z * 1.2, 5))}
               className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition-colors border-b border-slate-700"
               title="Zoom In"
            >
               <ZoomIn size={16} />
            </button>
            <button 
               onClick={() => setZoom(1)}
               className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition-colors border-b border-slate-700"
               title="Reset View"
            >
               <Maximize size={16} />
            </button>
            <button 
               onClick={() => setZoom(z => Math.max(z / 1.2, 0.5))}
               className="p-2 text-slate-300 hover:text-white hover:bg-slate-700 active:bg-slate-600 transition-colors"
               title="Zoom Out"
            >
               <ZoomOut size={16} />
            </button>
         </div>
      </div>

      {/* Visualization Area */}
      <div className="flex-1 w-full h-full relative" ref={containerRef}>
        {/* Grid Background */}
        <div className="absolute inset-0 opacity-10 pointer-events-none" 
             style={{ 
               backgroundImage: 'radial-gradient(#94a3b8 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }} 
        />
        
        <svg 
           viewBox={viewbox} 
           className="w-full h-full block"
           preserveAspectRatio="xMidYMid meet"
        >
          <defs>
             <radialGradient id="metalGradient" cx="50%" cy="50%" r="50%" fx="50%" fy="50%">
                <stop offset="0%" stopColor="#94a3b8" />
                <stop offset="90%" stopColor="#475569" />
                <stop offset="100%" stopColor="#334155" />
             </radialGradient>
             <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="2" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
             </filter>
          </defs>

          {/* Group for content to allow easy debugging if needed */}
          <g>
            {/* PINION */}
            <g transform={`rotate(${pinionAngle % 360})`}>
               <path d={pinionPath} fill="url(#metalGradient)" stroke="#cbd5e1" strokeWidth={design.pinion.module * 0.05} />
               <circle r={design.pinion.module * 2} fill="#1e293b" />
               <text 
                  x="0" y="0" dy=".3em" textAnchor="middle" fill="white" 
                  fontSize={design.pinion.module * 1.5} className="font-mono select-none"
                  transform={`rotate(${-pinionAngle % 360})`} // Counter-rotate text to keep it upright-ish or just let it spin
               >
                 P
               </text>
            </g>

            {/* GEAR */}
            <g transform={`translate(${design.centerDistance}, 0) rotate(${gearAngle % 360})`}>
               <path d={gearPath} fill="url(#metalGradient)" stroke="#cbd5e1" strokeWidth={design.gear.module * 0.05} />
               <circle r={design.gear.module * 3} fill="#1e293b" />
               <text 
                  x="0" y="0" dy=".3em" textAnchor="middle" fill="white" 
                  fontSize={design.gear.module * 1.5} className="font-mono select-none"
                  transform={`rotate(${-gearAngle % 360})`}
               >
                 G
               </text>
            </g>

            {/* Pitch Circles (dashed) - Visual Guide */}
            <circle cx="0" cy="0" r={design.pinion.diameter/2} fill="none" stroke="#ef4444" strokeWidth={design.pinion.module * 0.1} strokeDasharray={`${design.pinion.module} ${design.pinion.module}`} opacity="0.4" />
            <circle cx={design.centerDistance} cy="0" r={design.gear.diameter/2} fill="none" stroke="#ef4444" strokeWidth={design.gear.module * 0.1} strokeDasharray={`${design.pinion.module} ${design.pinion.module}`} opacity="0.4" />

            {/* Center Line */}
            <line 
                x1="0" y1="0" 
                x2={design.centerDistance} y2="0" 
                stroke="#cbd5e1" 
                strokeWidth={design.pinion.module * 0.1} 
                strokeDasharray={`${design.pinion.module/2} ${design.pinion.module/2}`}
                opacity="0.3"
            />
          </g>
        </svg>
      </div>
    </div>
  );
};

export default GearVisualizer;