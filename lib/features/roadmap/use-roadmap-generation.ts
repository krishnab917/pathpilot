"use client";
import { generateRoadmap } from "@/lib/api/roadmaps";
import { useAsyncAction } from "@/hooks/use-async-action";
export const useRoadmapGeneration = () => useAsyncAction(generateRoadmap);
