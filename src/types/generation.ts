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

// Task status for async generation
export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

// Generation task for async processing
export interface GenerationTask {
  id: string;
  user_id: string;
  prompt: string;
  image_url?: string;
  type: string;
  settings: GenerationSettings;
  status: TaskStatus;
  result_url?: string;
  error?: string;
  created_at: string;
  updated_at: string;
}

// API response for async task creation
export interface AsyncGenerateResponse {
  task_id: string;
  status: TaskStatus;
  message: string;
}

// API response for status check
export interface TaskStatusResponse {
  task_id: string;
  status: TaskStatus;
  result_url?: string;
  error?: string;
  progress?: number;
}
