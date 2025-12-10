import React, { useState, useEffect } from 'react';
import { DesignRequirements } from '../types';
import { Settings, Cpu, Wind, Activity, Zap, Calculator, Gauge } from 'lucide-react';

interface Props {
  req: DesignRequirements;
  onChange: (req: DesignRequirements) => void;
  onOptimize: () => void;
}

const InputPanel: React.FC<Props> = ({ req, onChange, onOptimize }) => {
  
  // Target Output State
  const [outputMode, setOutputMode] = useState<'torque' | 'power'>('torque');
  const [outputPowerVal, setOutputPowerVal] = useState<number>(0);
  const [outputPowerUnit, setOutputPowerUnit] = useState<'kw' | 'hp'>('kw');

  // Input Source State
  const [sourceMode, setSourceMode] = useState<'torque' | 'power'>('power');
  const [sourceVal, setSourceVal] = useState<number>(0);
  const [sourceUnit, setSourceUnit] = useState<'kw' | 'hp'>('kw');

  // --- SYNC EFFECTS ---

  // 1. Sync Output Panel Display when props change
  useEffect(() => {
    // P_out(kW) = T_out * RPM_out / 9550
    const kw = (req.targetOutputTorque * req.targetOutputRPM) / 9550;
    
    if (outputPowerUnit === 'kw') {
      setOutputPowerVal(parseFloat(kw.toFixed(2)));
    } else {
      setOutputPowerVal(parseFloat((kw / 0.7457).toFixed(2)));
    }
  }, [req.targetOutputTorque, req.targetOutputRPM, outputPowerUnit]);

  // 2. Sync Input Panel Display when props change
  useEffect(() => {
    // Conservation of Power: P_in = P_out (Efficiency = 1.0 for sizing)
    const powerKW = (req.targetOutputTorque * req.targetOutputRPM) / 9550;
    
    // T_in = 9550 * P_in / RPM_in
    const inputTorque = req.nominalInputRPM > 0 ? (powerKW * 9550) / req.nominalInputRPM : 0;

    if (sourceMode === 'power') {
       if (sourceUnit === 'kw') setSourceVal(parseFloat(powerKW.toFixed(2)));
       else setSourceVal(parseFloat((powerKW / 0.7457).toFixed(2)));
    } else {
       setSourceVal(parseFloat(inputTorque.toFixed(2)));
    }
  }, [req.targetOutputTorque, req.targetOutputRPM, req.nominalInputRPM, sourceMode, sourceUnit]);


  // --- HANDLERS ---

  const handleChange = (field: keyof DesignRequirements, value: any) => {
    onChange({ ...req, [field]: value });
  };

  // Handler for Target Output Power Input
  const handleOutputPowerChange = (val: number) => {
    setOutputPowerVal(val);
    let kw = val;
    if (outputPowerUnit === 'hp') kw = val * 0.7457;
    
    const newTorque = (9550 * kw) / (req.targetOutputRPM || 1);
    handleChange('targetOutputTorque', parseFloat(newTorque.toFixed(2)));
  };

  // Handler for Input Source Change (Back-calculates Output Torque)
  const handleSourceValChange = (val: number) => {
    setSourceVal(val);
    
    let kwIn = 0;
    if (sourceMode === 'power') {
        kwIn = sourceUnit === 'kw' ? val : val * 0.7457;
    } else {
        // Val is Torque Nm
        kwIn = (val * req.nominalInputRPM) / 9550;
    }

    // P_out = P_in
    // T_out = 9550 * P_out / RPM_out
    const newOutputTorque = (kwIn * 9550) / (req.targetOutputRPM || 1);
    
    handleChange('targetOutputTorque', parseFloat(newOutputTorque.toFixed(2)));
  };

  return (
    <div className="bg-slate-800 p-6 rounded-xl shadow-lg border border-slate-700 h-full flex flex-col gap-6 overflow-y-auto">
      <div className="flex items-center gap-3 text-emerald-400 border-b border-slate-700 pb-4">
        <Settings size={24} />
        <h2 className="text-xl font-bold">Design Parameters</h2>
      </div>

      {/* --- TARGET OUTPUT SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
           <h3 className="text-slate-400 font-semibold text-sm uppercase tracking-wider">Target Output</h3>
           <div className="flex bg-slate-900 rounded p-1">
              <button 
                onClick={() => setOutputMode('torque')}
                className={`px-2 py-1 text-xs rounded transition-colors ${outputMode === 'torque' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >Torque</button>
              <button 
                onClick={() => setOutputMode('power')}
                className={`px-2 py-1 text-xs rounded transition-colors ${outputMode === 'power' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >Power</button>
           </div>
        </div>

        <div className="group">
          <label className="block text-sm mb-1 text-slate-300">Desired Output RPM</label>
          <input 
            type="number" 
            value={req.targetOutputRPM}
            onChange={(e) => handleChange('targetOutputRPM', parseFloat(e.target.value))}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-emerald-500 focus:outline-none text-white"
          />
        </div>
        
        {outputMode === 'torque' ? (
          <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
            <label className="block text-sm mb-1 text-slate-300">Required Torque (Nm)</label>
            <input 
              type="number" 
              value={req.targetOutputTorque}
              onChange={(e) => handleChange('targetOutputTorque', parseFloat(e.target.value))}
              className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-emerald-500 focus:outline-none text-white transition-colors"
            />
            <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
               <Calculator size={10} />
               <span>≈ {outputPowerVal} {outputPowerUnit.toUpperCase()}</span>
            </div>
          </div>
        ) : (
          <div className="group animate-in fade-in slide-in-from-top-2 duration-300">
            <div className="flex justify-between items-center mb-1">
               <label className="block text-sm text-slate-300">Target Power</label>
               <select 
                  value={outputPowerUnit} 
                  onChange={(e) => setOutputPowerUnit(e.target.value as 'kw' | 'hp')}
                  className="bg-slate-900 text-xs border border-slate-600 rounded px-1 text-emerald-400 focus:outline-none cursor-pointer"
               >
                 <option value="kw">kW</option>
                 <option value="hp">HP</option>
               </select>
            </div>
            <div className="relative">
               <input 
                 type="number" 
                 value={outputPowerVal}
                 onChange={(e) => handleOutputPowerChange(parseFloat(e.target.value))}
                 className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-emerald-500 focus:outline-none text-white pl-8"
               />
               <Zap className="absolute left-2 top-2.5 text-yellow-500" size={16} />
            </div>
          </div>
        )}
      </div>

      <hr className="border-slate-700" />

      {/* --- INPUT CONSTRAINTS SECTION --- */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-slate-400 font-semibold text-sm uppercase tracking-wider">Input Constraints</h3>
          <div className="flex bg-slate-900 rounded p-1">
              <button 
                onClick={() => setSourceMode('torque')}
                className={`px-2 py-1 text-xs rounded transition-colors ${sourceMode === 'torque' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >Torque</button>
              <button 
                onClick={() => setSourceMode('power')}
                className={`px-2 py-1 text-xs rounded transition-colors ${sourceMode === 'power' ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'}`}
              >Power</button>
           </div>
        </div>
        
        <div className="group">
          <label className="block text-sm mb-1 text-slate-300">Nominal Input RPM</label>
          <input 
            type="number" 
            value={req.nominalInputRPM}
            onChange={(e) => handleChange('nominalInputRPM', parseFloat(e.target.value))}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-emerald-500 focus:outline-none text-white"
          />
        </div>

        {/* Source Power/Torque Input */}
        <div className="group animate-in fade-in slide-in-from-top-2 duration-300 bg-slate-900/50 p-3 rounded border border-slate-700/50">
             <div className="flex justify-between items-center mb-1">
               <label className="block text-xs font-medium text-emerald-400">
                  {sourceMode === 'power' ? 'Available Motor Power' : 'Available Motor Torque'}
               </label>
               {sourceMode === 'power' && (
                 <select 
                    value={sourceUnit} 
                    onChange={(e) => setSourceUnit(e.target.value as 'kw' | 'hp')}
                    className="bg-slate-900 text-xs border border-slate-600 rounded px-1 text-slate-300 focus:outline-none cursor-pointer"
                 >
                   <option value="kw">kW</option>
                   <option value="hp">HP</option>
                 </select>
               )}
             </div>
             <div className="relative">
                <input 
                  type="number" 
                  value={sourceVal}
                  onChange={(e) => handleSourceValChange(parseFloat(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-600 rounded p-2 text-sm focus:border-emerald-500 focus:outline-none text-white pl-8"
                />
                {sourceMode === 'power' ? (
                   <Zap className="absolute left-2 top-2 text-emerald-500" size={14} />
                ) : (
                   <Gauge className="absolute left-2 top-2 text-emerald-500" size={14} />
                )}
             </div>
             {sourceMode === 'torque' && <div className="text-right text-xs text-slate-500 mt-1">Nm</div>}
        </div>

        <div className="group">
          <label className="block text-sm mb-1 text-slate-300">Material Yield (MPa)</label>
          <select 
            value={req.materialYieldStrength}
            onChange={(e) => handleChange('materialYieldStrength', parseFloat(e.target.value))}
            className="w-full bg-slate-900 border border-slate-600 rounded p-2 focus:border-emerald-500 focus:outline-none text-white"
          >
            <option value={200}>Cast Iron (200 MPa)</option>
            <option value={250}>Mild Steel (250 MPa)</option>
            <option value={600}>Alloy Steel 4140 (600 MPa)</option>
            <option value={50}>Nylon (50 MPa)</option>
            <option value={800}>Titanium Grade 5 (800 MPa)</option>
          </select>
        </div>

        <div className="group">
          <label className="block text-sm mb-1 text-slate-300">Input Source Profile</label>
          <div className="grid grid-cols-3 gap-2">
            <button 
              onClick={() => handleChange('inputVariability', 'constant')}
              className={`p-2 rounded flex flex-col items-center justify-center gap-1 text-xs border ${req.inputVariability === 'constant' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
            >
              <Cpu size={16} />
              Const
            </button>
            <button 
              onClick={() => handleChange('inputVariability', 'sine')}
              className={`p-2 rounded flex flex-col items-center justify-center gap-1 text-xs border ${req.inputVariability === 'sine' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
            >
              <Wind size={16} />
              Wave
            </button>
            <button 
              onClick={() => handleChange('inputVariability', 'noise')}
              className={`p-2 rounded flex flex-col items-center justify-center gap-1 text-xs border ${req.inputVariability === 'noise' ? 'bg-emerald-900/50 border-emerald-500 text-emerald-300' : 'bg-slate-900 border-slate-700 text-slate-400 hover:bg-slate-800'}`}
            >
              <Activity size={16} />
              Noise
            </button>
          </div>
        </div>
      </div>

      <div className="mt-auto pt-4">
        <button 
          onClick={onOptimize}
          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-lg shadow-lg shadow-emerald-900/50 transition-all transform hover:scale-105"
        >
          Run Inverse Design
        </button>
      </div>
    </div>
  );
};

export default InputPanel;