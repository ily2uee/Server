export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // -------------------------
    // Добавление сервера
    // -------------------------
    if (url.pathname === "/add") {
      let placeId, jobId, pet;

      if (request.method === "POST") {
        try {
          const body = await request.json();
          placeId = body.placeId;
          jobId = body.jobId;
          pet = body.pet || "Unknown";
        } catch (err) {
          return new Response("Invalid JSON", { status: 400 });
        }
      } 
      else if (request.method === "GET") {
        placeId = url.searchParams.get("placeId");
        jobId = url.searchParams.get("jobId");
        pet = url.searchParams.get("pet") || "Unknown";
      }

      if (!placeId || !jobId) {
        return new Response("Missing placeId or jobId", { status: 400 });
      }

      await env.SERVERS.put(jobId, JSON.stringify({
        placeId: placeId,
        jobId: jobId,
        pet: pet,
        timestamp: Date.now()
      }));

      return new Response("OK", { status: 200 });
    }

    // -------------------------
    // Получение списка серверов
    // -------------------------
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
