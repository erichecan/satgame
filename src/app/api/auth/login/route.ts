import { signToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const { passcode } = await req.json();
    if (typeof passcode !== "string" || passcode !== process.env.ACCESS_PASSCODE) {
      return Response.json({ error: true, message: "口令不正确" }, { status: 401 });
    }

    const token = await signToken();
    const res = Response.json({ ok: true });
    res.headers.set(
      "Set-Cookie",
      `token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}${
        process.env.NODE_ENV === "production" ? "; Secure" : ""
      }`
    );
    return res;
  } catch (error) {
    console.error("[API Route Error]", error);
    return Response.json({ error: true, message: "登录失败" }, { status: 500 });
  }
}

export async function DELETE() {
  const res = Response.json({ ok: true });
  res.headers.set("Set-Cookie", "token=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
  return res;
}
