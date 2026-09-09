import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: "10mb" }));

// Lazy Gemini client getter
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }
  if (!aiClient) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", hasApiKey: Boolean(process.env.GEMINI_API_KEY) });
});

// Endpoint for AI suggestions
app.post("/api/ai-suggestions", async (req, res) => {
  try {
    const { items, checkingAccounts, strategy, userNotes, baseCurrency, exchangeRates } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(200).json({
        success: false,
        error: "NO_API_KEY",
        message: "No se encontró GEMINI_API_KEY configurada. Se usará el análisis algorítmico local y podrás descargar las instrucciones para usarlas en cualquier IA."
      });
    }

    const rateUsdMxn = exchangeRates?.USD_MXN || 18.5;

    const prompt = `Actúa como un Planificador Financiero Certificado (CFP) y experto en optimización de deudas crediticias binacionales (México y Estados Unidos).
Analiza la siguiente información de tarjetas de crédito y cuentas de débito/corriente del usuario y proporciona un plan de pagos ultra-eficiente y accionable.

INFORMACIÓN FINANCIERA:
---
Moneda Consolidada de Referencia: ${baseCurrency || "USD"}
Tipo de Cambio de Referencia: 1 USD = $${rateUsdMxn.toFixed(2)} MXN

Cuentas Corrientes / Fondos Disponibles:
${JSON.stringify(checkingAccounts, null, 2)}

Tarjetas de Crédito y Deudas:
${JSON.stringify(items, null, 2)}

Preferencia o Enfoque Estratégico: ${strategy || "Optimización híbrida (Salvar 0% APR + Minimizar Intereses)"}
${userNotes ? `Notas del Usuario: ${userNotes}` : ""}
---

Instrucciones para el análisis:
1. Analiza las tarjetas respetando su país (México o USA) y su moneda (MXN o USD).
2. Revisa las fechas en las que se termina la promoción de 0% APR. ¡ALERTA CRÍTICA! Si alguna tarjeta está cerca de terminar su 0% APR (menos de 60-90 días), calcula cuánto hay que pagar mensualmente antes de esa fecha en su moneda nativa para evitar intereses elevados.
3. Identifica las fechas de corte y fechas límite de pago para evitar recargos por mora y optimizar el reporte a burós de crédito (Buró de Crédito en México / FICO en USA).
4. Evalúa si el saldo disponible en las cuentas corrientes cubre los pagos mínimos y los "pagos para no generar intereses".
5. Proporciona una recomendación de asignación de dinero clara y ordenada:
   - Pagos inmediatos obligatorios (mínimos para evitar moras)
   - Pagos para no generar intereses prioritarios
   - Asignación de excedente recomendado (Método Avalancha vs liquidar 0% APR)
   - Recomendación cambiaria si tiene fondos en una moneda diferente a la deuda
6. Responde en español, con un tono motivador, profesional, estructurado con encabezados claros, viñetas y formato Markdown impecable.`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        systemInstruction: "Eres un asesor financiero experto de élite especializado en finanzas personales para México y Estados Unidos. Ofreces números claros, pasos concretos y explicaciones transparentes sin tecnicismos oscuros."
      }
    });

    const text = response.text || "No se pudo generar la sugerencia.";
    res.json({
      success: true,
      analysis: text
    });
  } catch (error: any) {
    console.error("Error al generar sugerencias de IA:", error);
    res.status(500).json({
      success: false,
      error: "AI_ERROR",
      message: error?.message || "Ocurrió un error al contactar al modelo de IA."
    });
  }
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
