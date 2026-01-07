/**
 * Credit Calculator for DesignAI
 * Calculates credit costs based on generation settings
 */

import { Resolution, ArtStyle, GenerationSettings, AspectRatio } from '@/types/generation';

// Base credit costs
export const BASE_COSTS = {
  standard: 3,
  upscale: 10,
} as const;

// Resolution multipliers (all resolutions cost the same - unified pricing)
export const RESOLUTION_MULTIPLIERS: Record<Resolution, number> = {
  '1K': 1.0,
  '2K': 1.0,
  '4K': 1.0,
};

// Art style multiplier (some styles require more processing)
export const STYLE_MULTIPLIERS: Partial<Record<ArtStyle, number>> = {
  'oil-painting': 1.5,
  'cinematic': 1.3,
  'realistic': 1.2,
  'anime': 1.1,
};

/**
 * Calculate the credit cost for a generation request
 * @param type - The generation type (e.g., 'upscale', 'background', etc.)
 * @param settings - The generation settings
 * @returns The calculated credit cost
 */
export function calculateCreditCost(
  type: string,
  settings: GenerationSettings
): number {
  // Get base cost
  const baseCost = type === 'upscale' ? BASE_COSTS.upscale : BASE_COSTS.standard;

  // Apply resolution multiplier
  const resolutionMultiplier = RESOLUTION_MULTIPLIERS[settings.resolution];

  // Apply style multiplier if applicable
  const styleMultiplier = settings.artStyle
    ? (STYLE_MULTIPLIERS[settings.artStyle] || 1.0)
    : 1.0;

  // Calculate single image cost (round to nearest integer)
  const singleCost = Math.round(baseCost * resolutionMultiplier * styleMultiplier);

  // Apply batch size multiplier if batch mode is enabled
  const batchSize = settings.batchMode && settings.batchSize ? settings.batchSize : 1;

  return singleCost * batchSize;
}

/**
 * Get a human-readable text for the credit cost
 * @param cost - The credit cost
 * @returns A formatted string for display
 */
export function getCreditDisplayText(cost: number): string {
  return `${cost} 积分`;
}

/**
 * Get the aspect ratio string for the AI model
 * Maps aspect ratio enum values to API format
 */
export function getAspectRatioForModel(aspectRatio: AspectRatio): string {
  return aspectRatio;
}
