import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mentor = readFileSync("client/src/components/UtilityWorkspaceSections.tsx", "utf8").split("export function CompactMentor")[1];
const roadmap = readFileSync("client/src/components/RoadmapExperience.tsx", "utf8");
const chat = readFileSync("client/src/components/AIChatBox.tsx", "utf8");

describe("AI loading integration contracts", () => {
  it("shows persisted Mentor results immediately only in the matching conversation", () => {
    expect(mentor).toContain("conversation.id !== result.conversationId) return");
    expect(mentor).toContain("previous && previous.conversation.id === result.conversationId");
    expect(mentor.indexOf("mentor.get.setData")).toBeLessThan(mentor.indexOf("mentor.get.invalidate"));
    expect(mentor).toContain("send.mutateAsync({ content })");
    expect(mentor).toContain("retry: false");
  });
  it("removes client preflight without bypassing generation and gates cache writes by owner", () => {
    expect(roadmap).not.toContain("roadmap.preflight.useMutation");
    expect(roadmap).toContain("roadmap.generate.useMutation");
    expect(roadmap).toContain("previous.profile?.userId === result.userId");
    expect(roadmap).toContain("buildLock.current = false");
    expect(roadmap).toContain('isRunning && <AiPendingStatus operation="roadmap"');
  });
  it("keeps a failed draft and blocks double submission while awaiting the mutation", () => {
    expect(chat).toContain("isLoading || sendLock.current");
    expect(chat).toContain("await onSendMessage(content)");
    expect(chat.indexOf("await onSendMessage(content)")).toBeLessThan(chat.indexOf("setInput(current =>"));
    expect(chat).toContain("setSending(false)");
    expect(chat).toContain('aria-label="Send message"');
  });
});
