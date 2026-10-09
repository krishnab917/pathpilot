import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  FeedbackState,
  ProgressIndicator,
} from "@/components/ProductPrimitives";
import { AiPendingStatus } from "@/components/AiPendingStatus";
import "../index.css";

function Controls() {
  const [open, setOpen] = useState(false);
  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <p className="eyebrow">
        Local palette review · No requests or saved data
      </p>
      <h1 className="text-3xl font-semibold">
        Controls, overlays, and feedback
      </h1>
      <div className="flex gap-4">
        <label>
          Palette{" "}
          <select
            aria-label="Palette"
            defaultValue={document.documentElement.dataset.palette}
            onChange={e => {
              document.documentElement.dataset.palette = e.target.value;
            }}
          >
            <option>A</option>
            <option>B</option>
            <option>C</option>
          </select>
        </label>
        <label>
          <input
            type="checkbox"
            defaultChecked={document.documentElement.classList.contains("dark")}
            onChange={e =>
              document.documentElement.classList.toggle(
                "dark",
                e.target.checked
              )
            }
          />{" "}
          Dark theme
        </label>
      </div>
      <section className="surface-panel space-y-5 p-6">
        <label className="field-label">
          Project name
          <Input className="mt-2" placeholder="Give your project a name" />
        </label>
        <Tabs defaultValue="active">
          <TabsList aria-label="Project status">
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="planned">Planned</TabsTrigger>
            <TabsTrigger value="done">Complete</TabsTrigger>
          </TabsList>
          <TabsContent value="active">
            <ProgressIndicator value={60} label="Example progress" />
          </TabsContent>
          <TabsContent value="planned">
            Your planned work stays available.
          </TabsContent>
          <TabsContent value="done">
            <p className="text-success">✓ Example complete</p>
          </TabsContent>
        </Tabs>
        <div className="flex flex-wrap gap-3">
          <Button>Primary action</Button>
          <Button variant="outline">Secondary</Button>
          <Button disabled>Unavailable</Button>
          <Button variant="destructive">Destructive</Button>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline">Review dialog</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Keep the next step manageable</DialogTitle>
              <DialogDescription>
                This is the actual PathPilot dialog primitive, with illustrative
                content and no saved data.
              </DialogDescription>
            </DialogHeader>
            <label className="field-label">
              Next action
              <Input
                className="mt-2"
                defaultValue="Test the planner with a classmate"
              />
            </label>
            <DialogFooter>
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </section>
      <AiPendingStatus operation="mentor" />
      <FeedbackState
        tone="error"
        title="That change could not be saved"
        description="Your input is still here. Try again when you are ready."
        action={<Button variant="outline">Retry</Button>}
      />
      <FeedbackState
        title="Your next idea can start here"
        description="Start a project to turn an interest into something you can try."
      />
      <p className="rounded-md bg-success-subtle p-4 text-success">
        ✓ Changes saved
      </p>
      <p className="rounded-md bg-warning-subtle p-4 text-warning">
        Attention: verify the source before applying.
      </p>
    </main>
  );
}

// A development-only entry, not a route in the application or production build.
if (import.meta.env.DEV) {
  const params = new URLSearchParams(location.search);
  document.documentElement.dataset.palette = params.get("palette") ?? "A";
  document.documentElement.classList.toggle(
    "dark",
    params.get("theme") === "dark"
  );
  createRoot(document.getElementById("root")!).render(<Controls />);
}
