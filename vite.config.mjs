import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { handleBookingRequest } from "./worker/index.js";
import { readFileSync } from "node:fs";
import path from "node:path";

function bookingApi(localEnv) {
  const workerEnv = {
    ...localEnv,
    ASSETS: {
      async fetch(request) {
        const url = new URL(request.url);
        if (url.pathname !== "/images/brand/easy-lux-logo-wordmark.png") return new Response("Not found", { status: 404 });
        return new Response(readFileSync(path.resolve("public", `.${url.pathname}`)), { headers: { "content-type": "image/png" } });
      },
    },
  };
  const attach = (server) => {
    server.middlewares.use('/api/booking', async (req, res) => {
      const chunks = [];
      for await (const chunk of req) chunks.push(chunk);
      const url = `http://${req.headers.host || 'localhost'}/api/booking`;
      const request = new Request(url, {
        method: req.method,
        headers: req.headers,
        body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks),
      });
      const response = await handleBookingRequest(request, workerEnv);
      res.writeHead(response.status, Object.fromEntries(response.headers));
      res.end(Buffer.from(await response.arrayBuffer()));
    });
  };
  return { name: 'booking-api', configureServer: attach, configurePreviewServer: attach };
}

// Match Cloudflare's clean page URLs when reviewing prerendered pages locally.
function pagePreview() {
  return {
    name: 'prerendered-page-preview',
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;
        if (!/^\/(?:ru(?:\/(?:services|about|faq|contact|cookies))?|services|about|faq|contact|cookies)\/?$/.test(pathname)) return next();
        try {
          const html = readFileSync(path.resolve('dist/client', pathname.replace(/^\/|\/$/g, ''), 'index.html'));
          res.setHeader('content-type', 'text/html; charset=utf-8');
          res.end(html);
        } catch { next(); }
      });
    },
  };
}

export default defineConfig(({ mode }) => ({
  // Cloudflare serves this site from the domain root. Keep the GitHub Pages
  // subpath only for its separate workflow.
  base: process.env.GITHUB_ACTIONS === "true" ? "/Easylux/" : "/",
  build: {
    outDir: "dist/client",
    manifest: true,
  },
  optimizeDeps: {
    include: ["react", "react-dom/client"],
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: ["terminal.local"],
    warmup: {
      clientFiles: ["./src/main.tsx"],
    },
  },
  plugins: [react(), tailwindcss(), bookingApi(loadEnv(mode, process.cwd(), '')), pagePreview()],
}));
