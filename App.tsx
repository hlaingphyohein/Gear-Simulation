import React, { useState, useEffect, useCallback } from 'react';
import { DesignRequirements, DesignResult, SimulationPoint } from './types';
import { calculateGearDesign, simulateStep } from './services/gearMath';
import InputPanel from './components/InputPanel';
import GearVisualizer from './components/GearVisualizer';
import SimulationCharts from './components/SimulationCharts';
import AiAssistant from './components/AiAssistant';
import { Play, Pause, RefreshCw, Menu, X } from 'lucide-react';

const App: React.FC = () => {
  // Initial Requirements
  const [req, setReq] = useState<DesignRequirements>({
    targetOutputTorque: 50, // Nm
    targetOutputRPM: 120,
    nominalInputRPM: 1200,
    materialYieldStrength: 250, // Mild Steel
    inputVariability: 'constant'
  });

  const [design, setDesign] = useState<DesignResult>(() => calculateGearDesign(req));
  const [simulationData, setSimulationData] = useState<SimulationPoint[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [simTime, setSimTime] = useState(0);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // For mobile

  // Recalculate design when optimize button is clicked
  const handleOptimize = useCallback(() => {
    const newDesign = calculateGearDesign(req);
    setDesign(newDesign);
    setSimTime(0);
    setSimulationData([]);
    // Close sidebar on mobile after optimization
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  }, [req]);

  // Simulation Loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();

    const loop = (currentTime: number) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      if (isRunning) {
        setSimTime(prev => {
          const newTime = prev + dt;
          const point = simulateStep(newTime, design, req);
          
          setSimulationData(currentData => {
             const newData = [...currentData, point];
             if (newData.length > 200) return newData.slice(newData.length - 200);
             return newData;
          });
          
          return newTime;
        });
      }
      animationFrameId = requestAnimationFrame(loop);
    };

    animationFrameId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animationFrameId);
  }, [isRunning, design, req]);

  return (
    <div className="flex flex-col lg:flex-row h-screen w-full bg-slate-950 text-slate-200 font-sans overflow-hidden">
      
      {/* Mobile Header / Navbar */}
      <div className="lg:hidden h-16 border-b border-slate-800 flex items-center justify-between px-4 bg-slate-900/90 backdrop-blur z-50">
        <div className="flex items-center gap-2">
             <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-bold">G</div>
             <h1 className="text-lg font-bold tracking-tight text-white">GearOpti</h1>
        </div>
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)} 
          className="p-2 text-slate-300 hover:text-white"
        >
           {isSidebarOpen ? <X size={24}/> : <Menu size={24}/>}
        </button>
      </div>

      {/* Sidebar: Inputs */}
      <div className={`
        fixed inset-0 z-40 bg-slate-950 lg:static lg:bg-transparent
        transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        w-full lg:w-80 h-full lg:h-auto flex-shrink-0 lg:border-r border-slate-800
      `}>
         <div className="h-full p-4 pt-20 lg:pt-4">
            <InputPanel 
              req={req} 
              onChange={setReq} 
              onOptimize={handleOptimize} 
            />
         </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden relative w-full">
        
        {/* Desktop Header */}
        <div className="hidden lg:flex h-16 border-b border-slate-800 items-center justify-between px-8 bg-slate-900/50 backdrop-blur">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-slate-900 font-bold">G</div>
             <h1 className="text-xl font-bold tracking-tight text-white">GearOpti-Sim <span className="text-emerald-500 text-sm font-normal">Web Edition</span></h1>
          </div>
          
          <div className="flex gap-4 items-center">
             <div className="text-xs text-slate-400 flex flex-col items-end">
                <span>Calculated Ratio: <strong className="text-white">{design.ratio.toFixed(2)}:1</strong></span>
                <span>Module: <strong className="text-white">{design.pinion.module}mm</strong></span>
             </div>
             
             <div className="h-8 w-px bg-slate-700 mx-2"></div>

             <button 
               onClick={() => setIsRunning(!isRunning)}
               className={`flex items-center gap-2 px-4 py-2 rounded-full font-bold transition-all ${isRunning ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'} text-white shadow-lg`}
             >
               {isRunning ? <><Pause size={16} /> Pause</> : <><Play size={16} /> Run</>}
             </button>
             
             <button 
               onClick={() => { setSimTime(0); setSimulationData([]); }}
               className="p-2 text-slate-400 hover:text-white transition-colors"
               title="Reset Simulation"
             >
                <RefreshCw size={20} />
             </button>
          </div>
        </div>

        {/* Mobile Controls (Sticky Bar) */}
        <div className="lg:hidden p-4 bg-slate-900/50 backdrop-blur border-b border-slate-800 flex justify-between items-center">
            <div className="text-xs text-slate-400">
               R: <span className="text-white">{design.ratio.toFixed(2)}</span> | M: <span className="text-white">{design.pinion.module}</span>
            </div>
            <div className="flex gap-2">
              <button 
                 onClick={() => setIsRunning(!isRunning)}
                 className={`flex items-center gap-1 px-3 py-1.5 text-sm rounded-full font-bold transition-all ${isRunning ? 'bg-amber-600' : 'bg-emerald-600'} text-white`}
               >
                 {isRunning ? <Pause size={14} /> : <Play size={14} />}
                 {isRunning ? "Pause" : "Run"}
               </button>
               <button onClick={() => { setSimTime(0); setSimulationData([]); }} className="p-1.5 bg-slate-800 rounded text-slate-300"><RefreshCw size={16}/></button>
            </div>
        </div>

        {/* Workspace Scrollable Area */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 lg:p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 lg:grid-rows-2 gap-6 min-h-min lg:h-full">
            
            {/* Visualizer & Charts */}
            <div className="col-span-1 lg:col-span-2 lg:row-span-2 flex flex-col gap-6 lg:h-full">
               <div className="h-[350px] lg:h-[60%] w-full flex-shrink-0">
                 <GearVisualizer design={design} isRunning={isRunning} simulationTime={simTime} />
               </div>
               <div className="h-[300px] lg:h-[40%] w-full flex-shrink-0">
                 <SimulationCharts data={simulationData} />
               </div>
            </div>

            {/* Right Column: Stats & AI */}
            <div className="col-span-1 lg:col-span-1 lg:row-span-2 flex flex-col gap-6 lg:h-full">
               {/* Stats */}
               <div className="bg-slate-800 p-5 rounded-xl border border-slate-700 flex-shrink-0">
                  <h3 className="text-slate-400 text-xs font-bold uppercase mb-4 tracking-wider">Design Report</h3>
                  <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-sm">
                     <div>
                       <div className="text-slate-500 text-xs">Pinion Teeth</div>
                       <div className="text-white font-mono">{design.pinion.teeth} (z)</div>
                     </div>
                     <div>
                       <div className="text-slate-500 text-xs">Gear Teeth</div>
                       <div className="text-white font-mono">{design.gear.teeth} (z)</div>
                     </div>
                     <div>
                       <div className="text-slate-500 text-xs">Center Dist</div>
                       <div className="text-white font-mono">{design.centerDistance.toFixed(2)} mm</div>
                     </div>
                     <div>
                       <div className="text-slate-500 text-xs">Face Width</div>
                       <div className="text-white font-mono">{design.pinion.faceWidth} mm</div>
                     </div>
                     <div className="col-span-2 border-t border-slate-700 pt-2 flex justify-between items-center">
                       <span className="text-slate-500 text-xs">Safety Factor (Bending)</span>
                       <span className={`font-mono font-bold ${design.safetyFactor < 1.5 ? 'text-red-400' : 'text-emerald-400'}`}>
                         {design.safetyFactor.toFixed(2)}
                       </span>
                     </div>
                  </div>
               </div>
               
               {/* AI - Flex grow on desktop, fixed height on mobile if needed or auto */}
               <div className="h-[400px] lg:h-auto lg:flex-1 min-h-0">
                 <AiAssistant design={design} />
               </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default App;