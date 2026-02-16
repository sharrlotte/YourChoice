import { handlers } from "@/lib/auth";

const authNotConfigured = () =>
  new Response("Authentication is not configured.", {
    status: 500,
  });

export const GET = handlers?.GET ?? authNotConfigured;
export const POST = handlers?.POST ?? authNotConfigured;
