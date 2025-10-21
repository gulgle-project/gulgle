import { oidcLogin } from "../auth";

// export async function loginUsernamePassword(req: Bun.BunRequest<any>): Promise<Response> {
//   const loginDto = await LoginSchema.parseAsync(req.body);
//   const user = await loginLocally(loginDto.email, loginDto.password);
//   return Response.json({ token: "token" } as LoginResponseDTO)
// }

export async function loginGithub(req: Bun.BunRequest<string>): Promise<Response> {
  return oidcLogin("github", "redirect", req);
}

export async function githubResponse(req: Bun.BunRequest<string>): Promise<Response> {
  return oidcLogin("github", "response", req);
}
