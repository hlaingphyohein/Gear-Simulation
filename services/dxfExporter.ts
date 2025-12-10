import { GearParams } from '../types';
import { PI } from './gearMath';

/**
 * Generates a minimal DXF string for a gear profile.
 */
export const generateGearDXF = (gear: GearParams): string => {
  const { teeth, module, pressureAngle } = gear;
  
  const pitchDiameter = teeth * module;
  const outerDiameter = pitchDiameter + 2 * module;
  const rootDiameter = pitchDiameter - 2.5 * module;
  const baseDiameter = pitchDiameter * Math.cos((pressureAngle * PI) / 180);

  // DXF Header
  let dxf = "0\nSECTION\n2\nENTITIES\n";

  // Generate teeth profile points for a single tooth
  const steps = 10;
  const points: {x: number, y: number}[] = [];

  // Full gear loop
  for (let t = 0; t < teeth; t++) {
     const angleStart = t * (2 * PI) / teeth;
     
     // Root
     const rRoot = rootDiameter / 2;
     points.push({
         x: rRoot * Math.cos(angleStart),
         y: rRoot * Math.sin(angleStart)
     });

     // Involute Approximation (simplified as linear for prototype DXF)
     const rTip = outerDiameter / 2;
     // Tooth width at pitch circle ~ pi*m / 2
     const angularWidth = (PI * module / 2) / (pitchDiameter / 2); // angle in radians
     
     const angleTipStart = angleStart + angularWidth * 0.4; // Tapering
     const angleTipEnd = angleStart + angularWidth * 0.6;
     const angleRootEnd = (t + 1) * (2 * PI) / teeth;

     points.push({
         x: rTip * Math.cos(angleTipStart),
         y: rTip * Math.sin(angleTipStart)
     });
     points.push({
         x: rTip * Math.cos(angleTipEnd),
         y: rTip * Math.sin(angleTipEnd)
     });
     points.push({
         x: rRoot * Math.cos(angleRootEnd),
         y: rRoot * Math.sin(angleRootEnd)
     });
  }

  // Write POLYLINE
  dxf += "0\nPOLYLINE\n8\n0\n66\n1\n";
  
  points.forEach(p => {
    dxf += "0\nVERTEX\n8\n0\n";
    dxf += `10\n${p.x.toFixed(4)}\n`; // X
    dxf += `20\n${p.y.toFixed(4)}\n`; // Y
    dxf += "30\n0.0\n"; // Z
  });
  
  // Close the loop
  dxf += "0\nVERTEX\n8\n0\n";
  dxf += `10\n${points[0].x.toFixed(4)}\n`;
  dxf += `20\n${points[0].y.toFixed(4)}\n`;
  dxf += "30\n0.0\n";

  dxf += "0\nSEQEND\n";
  dxf += "0\nENDSEC\n0\nEOF\n";

  return dxf;
};

export const downloadDXF = (gear: GearParams, name: string) => {
    const dxfContent = generateGearDXF(gear);
    const blob = new Blob([dxfContent], { type: 'application/dxf' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${name}_M${gear.module}_Z${gear.teeth}.dxf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
};
