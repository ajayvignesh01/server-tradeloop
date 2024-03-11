import { jwtVerify } from "https://deno.land/x/jose@v4.14.1/index.ts";

const VERIFY_JWT = Deno.env.get("SUPABASE_FUNCTIONS_VERIFY_JWT") === 'true'
const JWT_SECRET = Deno.env.get("SUPABASE_JWT_SECRET")

export async function handleJWT(req: Request) {
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
}

export function getAuthToken(req: Request) {
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

export async function verifyJWT(jwt: string): Promise<boolean> {
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