import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// 鉴权已按项目所有者明确要求关闭（单人个人项目，无需登录门槛）。
// 登录页面 / JWT 校验逻辑仍保留在代码里，未来需要恢复鉴权时
// 把下方 return NextResponse.next() 换回原来的 token 校验分支即可。
export async function proxy(_request: NextRequest) {
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
