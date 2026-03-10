import { oidcLogin } from "../auth";
import { logger } from "../logger";

// export async function loginUsernamePassword(req: Bun.BunRequest<any>): Promise<Response> {
//   const loginDto = await LoginSchema.parseAsync(req.body);
//   const user = await loginLocally(loginDto.email, loginDto.password);
//   return Response.json({ token: "token" } as LoginResponseDTO)
// }

export async function loginGithub(req: Bun.BunRequest<string>): Promise<Response> {
  try {
    return await oidcLogin("github", "redirect", req);
  } catch (error) {
    logger.error("GitHub login error:", error);
    return new Response("Login failed", { status: 500 });
  }
}

export async function githubResponse(req: Bun.BunRequest<string>): Promise<Response> {
  try {
    return await oidcLogin("github", "response", req);
  } catch (error) {
    logger.error("GitHub callback error:", error);
    return new Response(`Callback failed: ${error instanceof Error ? error.message : "Unknown error"}`, {
      status: 500,
    });
  }
}
