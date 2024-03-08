import { jwtVerify } from "https://deno.land/x/jose@v4.14.1/index.ts";
import {serve} from "https://deno.land/std@0.131.0/http/server.ts";

console.log('main function started')

// const JWT_SECRET = Deno.env.get("JWT_SECRET")
const JWT_SECRET = "eja61zN2U5SI74JjFKHD+L+bGA5lLSwhmyIXd8Ffp9E0spiMCWLLNfF401jRKxNCxo84QKE7/htGT6A8UrEqSQ=="
// const VERIFY_JWT = Deno.env.get("VERIFY_JWT")
const VERIFY_JWT = true

function getAuthToken(req: Request) {
    const authHeader = req.headers.get("authorization")
    if (!authHeader) {
        throw new Error("Missing authorization header")
    }
    const [bearer, token] = authHeader.split(" ")
    if (bearer !== "Bearer") {
        throw new Error(`Auth header is not 'Bearer {token}'`)
    }
    return token
}

async function verifyJWT(jwt: string): Promise<boolean> {
    const encoder = new TextEncoder()
    const secretKey = encoder.encode(JWT_SECRET)

    try {
        await jwtVerify(jwt, secretKey)
    } catch (err) {
        console.error(err)
        return false
    }
    return true
}

serve(async (req: Request) => {
    const url = new URL(req.url)
    const {pathname} = url

    // handle health checks
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

    // NOTE: You can test WebSocket in the main worker by uncommenting below.
    // if (pathname === '/_internal/ws') {
    // 	const upgrade = req.headers.get("upgrade") || ""
    //
    // 	if (upgrade.toLowerCase() != "websocket") {
    // 		return new Response("request isn't trying to upgrade to websocket.")
    // 	}
    //
    // 	const { socket, response } = Deno.upgradeWebSocket(req)
    //
    // 	socket.onopen = () => console.log("socket opened")
    // 	socket.onmessage = (e) => {
    // 		console.log("socket message:", e.data)
    // 		socket.send(new Date().toString())
    // 	}
    //
    // 	socket.onerror = e => console.log("socket errored:", e.message)
    // 	socket.onclose = () => console.log("socket closed")
    //
    // 	return response // 101 (Switching Protocols)
    // }

    if (req.method !== "OPTIONS" && VERIFY_JWT) {
        try {
            const token = getAuthToken(req)
            const isValidJWT = await verifyJWT(token)

            if (!isValidJWT) {
                return new Response(
                    JSON.stringify({ msg: "Invalid JWT"}),
                    { status: 401, headers: { "Content-Type": "application/json" } },
                )
            }
        } catch (e) {
            console.error(e)
            return new Response(
                JSON.stringify({msg: e.toString()}),
                {status: 401, headers: {"Content-Type": "application/json"}},
            )
        }
    }

    const path_parts = pathname.split("/")
    const service_name = path_parts[1]

    if (!service_name || service_name === "") {
        const error = { msg: "missing function name in request" }
        return new Response(
            JSON.stringify(error),
            { status: 400, headers: { "Content-Type": "application/json" } },
        )
    }

    const servicePath = `/home/deno/functions/${service_name}`
    console.error(`serving the request with ${servicePath}`)

    const createWorker = async () => {
        const memoryLimitMb = 150
        const workerTimeoutMs = 5 * 60 * 1000
        const noModuleCache = false

        // you can provide an import map inline
        // const inlineImportMap = {
        //   imports: {
        //     "std/": "https://deno.land/std@0.131.0/",
        //     "cors": "./examples/_shared/cors.ts"
        //   }
        // }
        // const importMapPath = `data:${encodeURIComponent(JSON.stringify(importMap))}?${encodeURIComponent('/home/deno/functions/test')}`
        const importMapPath = null

        const envVarsObj = Deno.env.toObject()
        const envVars = Object.keys(envVarsObj).map(k => [k, envVarsObj[k]])
        const forceCreate = false
        const netAccessDisabled = false

        // load source from an eszip
        // const maybeEszip = await Deno.readFile('./bin.eszip')
        // const maybeEntrypoint = 'file:///src/index.ts'

        // const maybeEntrypoint = 'file:///src/index.ts'
        // or load module source from an inline module
        // const maybeModuleCode = 'Deno.serve((req) => new Response("Hello from Module Code"))'

        const cpuTimeSoftLimitMs = 10000
        const cpuTimeHardLimitMs = 20000

        return await EdgeRuntime.userWorkers.create({
            servicePath,
            memoryLimitMb,
            workerTimeoutMs,
            noModuleCache,
            importMapPath,
            envVars,
            forceCreate,
            netAccessDisabled,
            cpuTimeSoftLimitMs,
            cpuTimeHardLimitMs,
            // maybeEszip,
            // maybeEntrypoint,
            // maybeModuleCode,
        })
    }

    const callWorker = async () => {
        try {
            // If a worker for the given service path already exists,
            // it will be reused by default.
            // Update forceCreate option in createWorker to force create a new worker for each request.
            const worker = await createWorker()
            const controller = new AbortController()

            const signal = controller.signal
            // Optional: abort the request after a timeout
            //setTimeout(() => controller.abort(), 2 * 60 * 1000)

            return await worker.fetch(req, { signal })
        } catch (e) {
            console.error(e)

            if (e instanceof Deno.errors.WorkerRequestCancelled) {
                // XXX(Nyannyacha): I can't think right now how to re-poll
                // inside the worker pool without exposing the error to the
                // surface.

                // It is satisfied when the supervisor that handled the original
                // request terminated due to reaches such as CPU time limit or
                // Wall-clock limit.
                //
                // The current request to the worker has been canceled due to
                // some internal reasons. We should repoll the worker and call
                // `fetch` again.
                // return await callWorker()
                console.log('cancelled!')
            }

            const error = { msg: e.toString() }
            return new Response(
                JSON.stringify(error),
                { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
        }
    }

    return callWorker()
})
