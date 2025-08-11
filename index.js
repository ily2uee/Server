export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // Добавить новый сервер (POST /add)
    if (url.pathname === "/add" && request.method === "POST") {
      try {
        const body = await request.json();
        if (!body.placeId || !body.jobId) {
          return new Response("Missing placeId or jobId", { status: 400 });
        }

        await env.SERVERS.put(body.jobId, JSON.stringify({
          placeId: body.placeId,
          jobId: body.jobId,
          pet: body.pet || "Unknown",
          timestamp: Date.now()
        }));

        return new Response("OK", { status: 200 });
      } catch (err) {
        return new Response("Invalid JSON", { status: 400 });
      }
    }

    // Получить список серверов (GET /list)
    if (url.pathname === "/list" && request.method === "GET") {
      const keys = await env.SERVERS.list();
      const servers = [];

      for (const key of keys.keys) {
        const value = await env.SERVERS.get(key.name);
        if (value) {
          servers.push(JSON.parse(value));
        }
      }

      // Оставляем только свежие записи (меньше 5 минут)
      const freshServers = servers.filter(s => Date.now() - s.timestamp < 5 * 60 * 1000);

      return new Response(JSON.stringify(freshServers), {
        headers: { "Content-Type": "application/json" }
      });
    }

    return new Response("Not Found", { status: 404 });
  }
}
