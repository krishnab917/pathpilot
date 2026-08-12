"use client";
import { sendMentorMessage } from "@/lib/ai/mentor-client";
import { useAsyncAction } from "@/hooks/use-async-action";
export const useMentor = () => useAsyncAction(({ content, conversationId }: { content: string; conversationId?: string }) => sendMentorMessage(content, conversationId));
