import { NextResponse, type NextRequest } from "next/server";
import { findShipmentAnywhere } from "@/lib/data";

export async function GET(req: NextRequest, { params }: { params: Promise<{ ref: string }> }) {
  const { ref } = await params;
  const s = findShipmentAnywhere(decodeURIComponent(ref));
  const url = req.nextUrl.clone();
  url.search = "";
  if (!s) {
    url.pathname = "/workspaces";
    return NextResponse.redirect(url, 302);
  }
  url.pathname = `/w/${s.workspace}/shipments/${s.id}/tracking`;
  return NextResponse.redirect(url, 302);
}
