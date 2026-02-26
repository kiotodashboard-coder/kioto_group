
import { GoogleGenAI } from "@google/genai";
import { Area, AreaInsight } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateAreaInsights = async (area: Area, existingInsights: AreaInsight[]): Promise<string> => {
  try {
    const prompt = `
      Como consultor empresarial experto del sistema Dashboard Kioto, analiza la siguiente área de negocio:
      Nombre: ${area.name}
      Descripción: ${area.description}
      Presupuesto Actual: $${area.budget}
      
      Información Existente:
      ${existingInsights.map(i => `- ${i.title}: ${i.content}`).join('\n')}

      Por favor, proporciona una recomendación estratégica concisa para esta área en 3 puntos clave. 
      EN ESPAÑOL. Enfócate en la eficiencia y el crecimiento corporativo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No se pudieron generar recomendaciones en este momento.";
  } catch (error) {
    console.error("Error de la API de Gemini:", error);
    return "Error al generar recomendaciones de IA. Por favor, verifica tu configuración.";
  }
};
