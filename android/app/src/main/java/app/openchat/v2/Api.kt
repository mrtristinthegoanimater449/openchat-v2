package app.openchat.v2

import android.content.Context
import org.json.JSONObject
import java.io.BufferedReader
import java.io.InputStreamReader
import java.io.OutputStreamWriter
import java.net.HttpURLConnection
import java.net.URL

/**
 * Minimal JSON-over-HTTP client for the OpenChat V2 server.
 * All data (accounts, app state) comes from the server — no local data blob.
 */
object Api {

    // Built-in default server — no manual entry needed.
    const val DEFAULT_SERVER_URL = "https://lid-graduation-automotive-mere.trycloudflare.com"

    fun getServerUrl(context: Context): String =
        prefs(context).getString("server_url", DEFAULT_SERVER_URL)
            ?.trimEnd('/')?.takeIf { it.isNotBlank() } ?: DEFAULT_SERVER_URL

    fun setServerUrl(context: Context, url: String) =
        prefs(context).edit().putString("server_url", url.trim().trimEnd('/')).apply()

    fun getToken(context: Context): String? = prefs(context).getString("token", null)

    fun setToken(context: Context, token: String?) =
        prefs(context).edit().apply {
            if (token == null) remove("token") else putString("token", token)
        }.apply()

    fun getUserJson(context: Context): String? = prefs(context).getString("user_json", null)

    fun setUserJson(context: Context, json: String?) =
        prefs(context).edit().apply {
            if (json == null) remove("user_json") else putString("user_json", json)
        }.apply()

    fun getStateJson(context: Context): String? = prefs(context).getString("state_json", null)

    fun setStateJson(context: Context, json: String?) =
        prefs(context).edit().apply {
            if (json == null) remove("state_json") else putString("state_json", json)
        }.apply()

    private fun prefs(context: Context) =
        context.getSharedPreferences("openchat_v2", Context.MODE_PRIVATE)

    /** Returns HTTP status and raw body. Throws on network failure. */
    fun request(
        context: Context,
        method: String,
        path: String,
        body: JSONObject? = null,
        auth: Boolean = true
    ): Pair<Int, String> {
        val url = URL(getServerUrl(context) + path)
        val conn = (url.openConnection() as HttpURLConnection).apply {
            requestMethod = method
            connectTimeout = 10_000
            readTimeout = 15_000
            doInput = true
            setRequestProperty("Accept", "application/json")
            if (body != null) {
                doOutput = true
                setRequestProperty("Content-Type", "application/json")
            }
            if (auth) {
                getToken(context)?.let { setRequestProperty("Authorization", "Bearer $it") }
            }
        }
        if (body != null) {
            OutputStreamWriter(conn.outputStream, Charsets.UTF_8).use { it.write(body.toString()) }
        }
        val stream = if (conn.responseCode in 200..299) conn.inputStream else conn.errorStream
        val text = stream?.let { s ->
            BufferedReader(InputStreamReader(s, Charsets.UTF_8)).use { it.readText() }
        } ?: ""
        return conn.responseCode to text
    }

    fun login(context: Context, username: String, password: String): JSONObject {
        val (code, text) = request(context, "POST", "/api/auth/login",
            JSONObject().put("username", username).put("password", password), auth = false)
        return JSONObject(text).put("_http", code)
    }

    fun register(context: Context, username: String, password: String): JSONObject {
        val (code, text) = request(context, "POST", "/api/auth/register",
            JSONObject().put("username", username).put("password", password), auth = false)
        return JSONObject(text).put("_http", code)
    }

    fun me(context: Context): JSONObject {
        val (code, text) = request(context, "GET", "/api/auth/me")
        return JSONObject(text).put("_http", code)
    }

    fun logout(context: Context) {
        try { request(context, "POST", "/api/auth/logout", JSONObject()) } catch (_: Exception) {}
        setToken(context, null)
        setUserJson(context, null)
    }

    fun fetchState(context: Context): JSONObject? {
        val (code, text) = request(context, "GET", "/api/state")
        if (code != 200) return null
        val root = JSONObject(text)
        return if (root.has("state") && !root.isNull("state")) root.getJSONObject("state") else null
    }

    fun saveState(context: Context, state: JSONObject): Boolean {
        val (code, _) = request(context, "PUT", "/api/state", JSONObject().put("state", state))
        return code in 200..299
    }
}
