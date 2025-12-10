import React from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { SimulationPoint } from '../types';

interface Props {
  data: SimulationPoint[];
}

const SimulationCharts: React.FC<Props> = ({ data }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      
      {/* Torque Chart */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
        <h3 className="text-slate-300 text-sm font-semibold mb-2">Torque Response (Input vs Output)</h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(v) => v.toFixed(1)} label={{ value: 'Time (s)', position: 'insideBottom', offset: -5 }} />
              <YAxis stroke="#94a3b8" label={{ value: 'Torque (Nm)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                itemStyle={{ color: '#e2e8f0' }}
                labelFormatter={(v) => `T: ${v.toFixed(2)}s`}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="inputTorque" stroke="#34d399" name="Input T (Ref)" strokeWidth={2} dot={false} />
              <Line type="monotone" dataKey="outputTorque" stroke="#60a5fa" name="Output T (Load)" strokeWidth={2} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Stress Chart */}
      <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 flex flex-col">
        <h3 className="text-slate-300 text-sm font-semibold mb-2">Pinion Root Stress (Dynamic)</h3>
        <div className="flex-1 min-h-[200px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" stroke="#94a3b8" tickFormatter={(v) => v.toFixed(1)} />
              <YAxis stroke="#94a3b8" label={{ value: 'Stress (MPa)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#475569', color: '#f1f5f9' }}
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Legend verticalAlign="top" height={36}/>
              <Line type="monotone" dataKey="stress" stroke="#ef4444" name="Bending Stress" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default SimulationCharts;
