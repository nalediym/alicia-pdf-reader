// Simple Bun server for smoke test
const server = Bun.serve({
  port: 8000,
  fetch(req) {
    const url = new URL(req.url);
    const path = url.pathname;
    
    // Serve files from the project directory
    const filePath = path === '/' ? '/demo/smoke-test.html' : path;
    const fullPath = `${import.meta.dir}${filePath}`;
    
    const file = Bun.file(fullPath);
    return new Response(file);
  },
});

console.log(`✅ Server running at http://localhost:${server.port}/demo/smoke-test.html`);