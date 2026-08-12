# PathPilot FastAPI Service

The backend is an independently deployable FastAPI application. It exposes HTTP endpoints under `/api/v1` and owns all application use cases. Route handlers only validate transport input and invoke services. The services in turn depend on repository protocols and domain engines, so neither the simulation scorer nor roadmap policy imports UI, HTTP, or Supabase SDK code.

## Local Development

Install Python dependencies with `sudo pip3 install -r requirements.txt`, then run `uvicorn app.main:app --reload`. Configuration is supplied through deployment secrets, never through committed `.env` files.

## Integration Boundary

The Supabase JWT verifier, Supabase repository composition root, and structured AI adapter remain intentionally unconfigured until the project receives the corresponding external service values. This avoids insecure fallback authentication and prevents simulated guidance from being presented as real AI output.
