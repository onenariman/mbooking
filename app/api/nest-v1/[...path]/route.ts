import { type NextRequest } from "next/server";
import {
  forwardNestV1Request,
  type NestV1CatchAllCtx,
} from "@/src/server/nest-v1-forward";

export const runtime = "nodejs";

function forward(req: NextRequest, ctx: NestV1CatchAllCtx) {
  return forwardNestV1Request("owner", req, ctx);
}

export function GET(req: NextRequest, ctx: NestV1CatchAllCtx) {
  return forward(req, ctx);
}

export function POST(req: NextRequest, ctx: NestV1CatchAllCtx) {
  return forward(req, ctx);
}

export function PATCH(req: NextRequest, ctx: NestV1CatchAllCtx) {
  return forward(req, ctx);
}

export function PUT(req: NextRequest, ctx: NestV1CatchAllCtx) {
  return forward(req, ctx);
}

export function DELETE(req: NextRequest, ctx: NestV1CatchAllCtx) {
  return forward(req, ctx);
}
