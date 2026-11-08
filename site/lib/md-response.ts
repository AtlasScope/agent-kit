export const mdResponse = (body: string, type = "text/markdown") =>
  new Response(body + "\n", { headers: { "content-type": `${type}; charset=utf-8`, "x-robots-tag": "noindex" } });
