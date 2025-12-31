/**
 * Generation Settings Types for DesignAI
 * Defines all quality and style parameters for image generation
 */

// Resolution options with associated credit multipliers
export type Resolution = '1K' | '2K' | '4K';

// Aspect ratio options
export type AspectRatio = '1:1' | '16:9' | '4:3' | '3:4' | '9:16';

// Scene type options
export type SceneType =
  | 'product'        // Product photography
  | 'portrait'       // Portrait/fashion
  | 'landscape'      // Landscape/nature
  | 'interior'       // Interior design
  | 'food'           // Food photography
  | 'abstract';      // Abstract art

// Art style options
export type ArtStyle =
  | 'realistic'      // Photorealistic
  | 'anime'          // Anime/manga style
  | 'oil-painting'   // Oil painting
  | 'watercolor'     // Watercolor
  | 'digital-art'    // Digital art
  | 'pencil-sketch'  // Pencil sketch
  | 'cinematic';     // Cinematic/Movie style

// Complete generation settings interface
export interface GenerationSettings {
  resolution: Resolution;
  aspectRatio: AspectRatio;
  sceneType?: SceneType;
  artStyle?: ArtStyle;
  batchMode?: boolean;
  batchSize?: number;
}

// Extended API request payload
export interface GenerateRequest {
  prompt: string;
  image_url: string;
  type: string;
  settings?: GenerationSettings;
}

// Credit cost configuration
export interface CreditCostConfig {
  baseCost: number;
  resolutionMultiplier: Record<Resolution, number>;
  styleMultiplier: number;
}
