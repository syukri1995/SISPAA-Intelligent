import { SignJWT } from "jose";
import type { Page } from "@playwright/test";

const secret = new TextEncoder().encode(process.env.JWT_SECRET_KEY || "secret-key-change-in-production");

export async function setAuthCookie(page: Page, opts: { role: string; sub?: string; agency?: string | null } = { role: "admin" }) {
  // Match client-side session checks (dashboard pages read localStorage).
  await page.addInitScript(({ role, sub, agency }) => {
    window.localStorage.setItem("token", "e2e-token");
    window.localStorage.setItem("user_id", sub || "e2e-user");
    window.localStorage.setItem("role", role);
    if (typeof agency !== "undefined" && agency !== null) window.localStorage.setItem("agency", agency);
  }, { role: opts.role, sub: opts.sub ?? "e2e-user", agency: opts.agency ?? null });

  const token = await new SignJWT({
    role: opts.role,
    agency: opts.agency ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(opts.sub ?? "e2e-user")
    .setExpirationTime("2h")
    .sign(secret);

  await page.context().addCookies([
    {
      name: "sispaa_token",
      value: token,
      domain: "localhost",
      path: "/",
      httpOnly: false,
      secure: false,
      sameSite: "Lax",
    },
  ]);
}

