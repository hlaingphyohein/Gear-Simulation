import { GoogleGenAI } from "@google/genai";
import { DesignResult } from '../types';

let genAI: GoogleGenAI | null = null;

const getGenAI = () => {
    if (!genAI) {
        // Use process.env.API_KEY directly as per guidelines
        genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    }
    return genAI;
};

export const getEngineeringAdvice = async (
    design: DesignResult, 
    userQuery: string
): Promise<string> => {
    try {
        const ai = getGenAI();
        const model = "gemini-2.5-flash"; // Using flash for quick text responses
        
        const systemPrompt = `
        You are an expert Senior Mechanical Engineer specializing in power transmission and gear design.
        Analyze the provided gear train design specifications.
        Provide concise, technical advice. 
        Focus on material selection, lubrication, potential failure modes (pitting, scuffing), and manufacturing feasibility.
        
        Current Design:
        - Ratio: ${design.ratio.toFixed(2)}:1
        - Module: ${design.pinion.module} mm
        - Pinion: ${design.pinion.teeth} teeth, ${design.pinion.rpm.toFixed(0)} RPM, ${(design.pinion.diameter).toFixed(1)}mm Dia
        - Gear: ${design.gear.teeth} teeth, ${design.gear.torque.toFixed(1)} Nm Torque, ${(design.gear.diameter).toFixed(1)}mm Dia
        - Safety Factor (Bending): ~${design.safetyFactor.toFixed(2)}
        `;

        const response = await ai.models.generateContent({
            model: model,
            contents: userQuery,
            config: {
                systemInstruction: systemPrompt,
            }
        });

        return response.text || "No analysis available.";
    } catch (error) {
        console.error("Gemini API Error:", error);
        return "Error connecting to AI Advisor. Please check your API key.";
    }
};