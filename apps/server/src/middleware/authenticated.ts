import jwt, { type JwtPayload } from "jsonwebtoken";
import { getJwtSecret } from "../auth";
import { RequestContext, USER_KEY } from "./context";
export function authenticated<T extends string>(
  handler: (r: RequestContext) => Promise<Response>,
): (r: Bun.BunRequest<T>) => Promise<Response> | Response {
  return (req) => {
    if (!req.headers.get("Authorization")) {
      return Promise.resolve(Response.redirect("/login", 302));
    }

    const context = new RequestContext(req);

    const auth = req.headers.get("Authorization");
    if (!auth || !auth.startsWith("Bearer ")) {
      return new Response(null, { status: 401 });
    }

    const token = auth.replace("Bearer ", "");
    let parsedToken: string | JwtPayload;
    try {
      parsedToken = jwt.verify(token, getJwtSecret());
    } catch {
      return new Response(null, { status: 401 });
    }

    // If the token cannot be parsed
    if (typeof parsedToken === "string") {
      return new Response(null, { status: 500 });
    }

    context.addData(USER_KEY, parsedToken.userId);

    return handler(context);
  };
}
