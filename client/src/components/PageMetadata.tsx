import { useEffect } from "react";
import { useLocation } from "wouter";
import { publicOrigin, seoHead } from "@shared/public-seo";

export function PageMetadata() {
  const [location] = useLocation();
  useEffect(() => {
    document.head
      .querySelectorAll("[data-pathpilot-seo], title")
      .forEach(node => node.remove());
    const template = document.createElement("template");
    template.innerHTML = seoHead(
      location,
      window.location.origin !== publicOrigin ||
        document.documentElement.dataset.preview === "true"
    );
    document.head.append(template.content);
  }, [location]);
  return null;
}
