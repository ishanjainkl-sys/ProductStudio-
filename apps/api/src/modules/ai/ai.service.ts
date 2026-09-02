import { GoogleGenAI, Type, Schema } from "@google/genai";
import { loadEnv } from "../../config/env.js";
import { UnprocessableError } from "../../lib/errors.js";

function getClient() {
    const env = loadEnv();
    if (!env.GEMINI_API_KEY) {
        throw new UnprocessableError("GEMINI_API_KEY is not set in environment.");
    }
    return new GoogleGenAI({
        apiKey: env.GEMINI_API_KEY,
        httpOptions: { timeout: 300000 }
    });
}

function parseAIResponse(txt: string) {
    if (!txt) throw new Error("No response generated");
    // Strip markdown formatting if present
    let clean = txt.trim();
    if (clean.startsWith("\`\`\`json")) {
        clean = clean.replace(/^\`\`\`json/, "").replace(/\`\`\`$/, "").trim();
    } else if (clean.startsWith("\`\`\`")) {
        clean = clean.replace(/^\`\`\`/, "").replace(/\`\`\`$/, "").trim();
    }
    // Extract everything between first { and last }
    const start = clean.indexOf('{');
    const end = clean.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end >= start) {
        clean = clean.substring(start, end + 1);
    }
    try {
        return JSON.parse(clean);
    } catch (e) {
        throw new Error("Failed to parse AI response as JSON: " + txt);
    }
}

// Allowed components and rough structure
const COMPONENT_SCHEMAS = `
Basic: text, heading, button, image, divider
Layout: section, container, stack, grid, spacer
Marketing: hero, cta-banner, testimonial, feature-grid
Business: stats-counter, team-grid
Navigation: navbar, footer
Forms: text-input, form-container, submit-button
Utility: embed, anchor

Each component should have 'id' (a unique string), 'type' (one of the above strings), and 'props' (a string-keyed object).
`;

const SYSTEM_PROMPT = `You are the ProductStudio website-building assistant.
You can only use components from the supplied component registry.
Never invent component types.
Never return executable JavaScript, React code, HTML, CSS, SQL, shell commands, or arbitrary code.
Return only valid structured data matching the provided schema.
Do not delete existing content unless explicitly requested.
Preserve existing component IDs when editing.
Only modify the properties required by the user's request.
Respect the application's theme, responsive behavior, and component constraints.
CRITICAL: You must return ONLY pure, raw JSON. Do NOT wrap it in markdown backticks (\`\`\`json) and DO NOT include any conversational text like "Here is the JSON." Start directly with { and end with }!`;

const generateSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        page: {
            type: Type.OBJECT,
            properties: {
                name: { type: Type.STRING },
                theme: { type: Type.STRING },
                components: {
                    type: Type.ARRAY,
                    items: {
                        type: Type.OBJECT,
                        properties: {
                            id: { type: Type.STRING },
                            type: { type: Type.STRING },
                            props: { type: Type.OBJECT },
                            children: {
                                type: Type.ARRAY,
                                items: {
                                    type: Type.OBJECT
                                }
                            }
                        }
                    }
                }
            }
        }
    }
};

const editSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        updates: {
            type: Type.OBJECT,
            description: "A map of props to update"
        }
    }
};

const seoSchema: Schema = {
    type: Type.OBJECT,
    properties: {
        title: { type: Type.STRING },
        description: { type: Type.STRING },
        keywords: { type: Type.STRING }
    }
};

export async function generatePage(prompt: string, projectId: string, pageId: string) {
    const ai = getClient();
    const res = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [prompt, "\n\nAvailable components:\n" + COMPONENT_SCHEMAS],
        config: {
            systemInstruction: SYSTEM_PROMPT
        }
    });

    const txt = res.text || "";
    return parseAIResponse(txt);
}

export async function editComponent(prompt: string, projectId: string, pageId: string, componentId: string, currentComponentStr: string) {
    const ai = getClient();
    const res = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
            `User request: ${prompt}\nCurrent Component: ${currentComponentStr}\nComponent ID: ${componentId}`
        ],
        config: {
            systemInstruction: SYSTEM_PROMPT
        }
    });

    const txt = res.text || "";
    return parseAIResponse(txt);
}

export async function generateSeo(pageContentStr: string) {
    const ai = getClient();
    const res = await ai.models.generateContent({
        model: "gemini-3.6-flash",
        contents: [
            "Based on the following page content, generate SEO metadata. Do not hallucinate claims.",
            pageContentStr
        ],
        config: {
            systemInstruction: "You are an SEO expert. CRITICAL: You must return ONLY pure, raw JSON matching this schema: { \"title\": string, \"description\": string, \"keywords\": string }. Do NOT wrap it in markdown backticks and DO NOT include any conversational text. Start directly with { and end with }!"
        }
    });

    const txt = res.text || "";
    return parseAIResponse(txt);
}
