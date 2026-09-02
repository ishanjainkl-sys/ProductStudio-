import { Request, Response, NextFunction } from "express";
import * as aiService from "./ai.service.js";
import { UnprocessableError } from "../../lib/errors.js";

export async function generate(req: Request, res: Response, next: NextFunction) {
    try {
        const { prompt, projectId, pageId } = req.body;
        if (!prompt) {
            throw new UnprocessableError("Prompt is required");
        }
        const result = await aiService.generatePage(prompt, projectId, pageId);
        res.json(result);
    } catch (error: any) {
        if (error.status || error.message?.includes("Failed to parse") || error.name === "ApiError" || error instanceof TypeError) {
            next(new UnprocessableError(error.message || "AI Error"));
        } else {
            next(error);
        }
    }
}

export async function edit(req: Request, res: Response, next: NextFunction) {
    try {
        const { prompt, projectId, pageId, selectedComponentId, currentComponentNode } = req.body;
        if (!prompt) throw new UnprocessableError("Prompt is missing");
        if (!selectedComponentId) throw new UnprocessableError("No component selected");
        if (!currentComponentNode) throw new UnprocessableError("Failed to extract current component node data");

        const result = await aiService.editComponent(prompt, projectId, pageId, selectedComponentId, currentComponentNode);
        res.json(result);
    } catch (error: any) {
        if (error.status || error.message?.includes("Failed to parse") || error.name === "ApiError" || error instanceof TypeError) {
            next(new UnprocessableError(error.message || "AI Error"));
        } else {
            next(error);
        }
    }
}

export async function seo(req: Request, res: Response, next: NextFunction) {
    try {
        const { pageContentStr } = req.body;
        if (!pageContentStr) {
            return res.status(400).json({ error: "Missing page content string" });
        }
        const result = await aiService.generateSeo(pageContentStr);
        res.json(result);
    } catch (error: any) {
        if (error.status || error.message?.includes("Failed to parse") || error.name === "ApiError") {
            next(new UnprocessableError(error.message || "AI Error"));
        } else {
            next(error);
        }
    }
}
