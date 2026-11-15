import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { load } from "cheerio";
import { describe, expect, it, vi } from "vitest";
import RichMentorMessage from "../client/src/components/RichMentorMessage";

vi.stubGlobal("React", React);
const render = (content: string) => load(renderToStaticMarkup(React.createElement(RichMentorMessage, { content })));

describe("untrusted Mentor Markdown", () => {
  it("drops embedded active HTML while preserving Markdown", () => {
    const $ = render('[Resource](https://example.com)\n\n**Useful guidance**\n\n<iframe srcdoc="<script>alert(1)</script>"></iframe>\n\n<img src=x onerror="alert(1)">');
    expect($("iframe,script,img,object,embed,form").length).toBe(0);
    expect($("[onerror],[srcdoc]").length).toBe(0);
    expect($('strong,[data-streamdown="strong"]').text()).toBe("Useful guidance");
    expect($("a").attr("href")).toBe("https://example.com/");
  });
  it("never requests remote images containing private context", () => {
    const $ = render('![An example](https://example.com/track?context=PRIVATE_SENTINEL)');
    expect($("img").length).toBe(0);
    expect($.html()).not.toContain("PRIVATE_SENTINEL");
    expect($.text()).toContain("An example");
  });
  it("rejects active URL schemes and retains tables and explicit safe links", () => {
    const $ = render('[Unsafe](javascript:alert%281%29)\n\n| Step | Action |\n| --- | --- |\n| One | Start |\n\n[Reference](https://example.com/path)');
    expect($("a").length).toBe(1);
    expect($("a").attr("rel")).toBe("noopener noreferrer");
    expect($("a").attr("referrerpolicy")).toBe("no-referrer");
    expect($("table").length).toBe(1);
  });
});
