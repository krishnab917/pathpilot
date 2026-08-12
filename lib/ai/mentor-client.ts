import { apiRequest } from "@/lib/api/http";
export type MentorReply = { conversation_id: string; reply: string };
export const sendMentorMessage = (content: string, conversationId?: string) => apiRequest<MentorReply>("mentor/messages", { method: "POST", body: { content, conversation_id: conversationId } });
