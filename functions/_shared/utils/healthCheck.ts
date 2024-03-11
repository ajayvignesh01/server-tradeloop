export async function healthCheck(req: Request, pathname: string) {
    if (pathname === '/_internal/health') {
        return new Response(
            JSON.stringify({ 'message': 'ok' }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
        )
    }

    if (pathname === '/_internal/metric') {
        const metric = await EdgeRuntime.getRuntimeMetrics()
        return Response.json(metric)
    }

    if (pathname === '/_internal/ws') {
    	const upgrade = req.headers.get("upgrade") || ""
    
    	if (upgrade.toLowerCase() != "websocket") {
    		return new Response("request isn't trying to upgrade to websocket.")
    	}
    
    	const { socket, response } = Deno.upgradeWebSocket(req)
    
    	socket.onopen = () => console.log("socket opened")
    	socket.onmessage = (e) => {
    		console.log("socket message:", e.data)
    		socket.send(new Date().toString())
    	}
    
    	socket.onerror = e => console.log("socket errored:", e.message)
    	socket.onclose = () => console.log("socket closed")
    
    	return response // 101 (Switching Protocols)
    }

}