package app.openchat.v2

import org.json.JSONArray
import org.json.JSONObject

object Models {

    data class Message(
        val id: String,
        val authorId: String,
        val authorUsername: String,
        val authorDiscriminator: String,
        val authorAvatar: String,
        val content: String,
        val timestamp: String
    )

    data class Channel(val id: String, val name: String, val type: String)

    data class Server(
        val id: String,
        val name: String,
        val channels: List<Channel>,
        val members: Int
    )

    data class AppState(
        val servers: List<Server>,
        val messages: Map<String, List<Message>>
    )

    fun parseMessage(obj: JSONObject): Message = Message(
        id = obj.optString("id"),
        authorId = obj.optJSONObject("author")?.optString("id") ?: "",
        authorUsername = obj.optJSONObject("author")?.optString("username") ?: "Unknown",
        authorDiscriminator = obj.optJSONObject("author")?.optString("discriminator") ?: "0000",
        authorAvatar = obj.optJSONObject("author")?.optString("avatar") ?: "",
        content = obj.optString("content"),
        timestamp = obj.optString("timestamp")
    )

    /** Parse the synced /api/state blob into the native view model. */
    fun parseState(state: JSONObject?): AppState {
        if (state == null) return AppState(emptyList(), emptyMap())

        val servers = mutableListOf<Server>()
        state.optJSONArray("servers")?.let { arr ->
            for (i in 0 until arr.length()) {
                val s = arr.getJSONObject(i)
                val channels = mutableListOf<Channel>()
                s.optJSONArray("categories")?.let { cats ->
                    for (c in 0 until cats.length()) {
                        cats.getJSONObject(c).optJSONArray("channels")?.let { ch ->
                            for (j in 0 until ch.length()) {
                                val chan = ch.getJSONObject(j)
                                channels += Channel(
                                    id = chan.optString("id"),
                                    name = chan.optString("name"),
                                    type = chan.optString("type")
                                )
                            }
                        }
                    }
                }
                servers += Server(
                    id = s.optString("id"),
                    name = s.optString("name"),
                    channels = channels,
                    members = s.optJSONArray("members")?.length() ?: 1
                )
            }
        }

        val messages = mutableMapOf<String, List<Message>>()
        state.optJSONObject("messages")?.let { m ->
            for (key in m.keys()) {
                val arr = m.optJSONArray(key) ?: continue
                val list = mutableListOf<Message>()
                for (i in 0 until arr.length()) list += parseMessage(arr.getJSONObject(i))
                messages[key] = list
            }
        }

        return AppState(servers, messages)
    }

    fun messageToJson(msg: Message, rawAuthor: JSONObject?): JSONObject = JSONObject().apply {
        put("id", msg.id)
        put("channelId", JSONObject.NULL)
        put("author", rawAuthor ?: JSONObject().apply {
            put("id", msg.authorId)
            put("username", msg.authorUsername)
            put("discriminator", msg.authorDiscriminator)
            put("avatar", msg.authorAvatar)
        })
        put("content", msg.content)
        put("timestamp", msg.timestamp)
        put("reactions", JSONArray())
    }

    /** Build a brand-new server JSON blob compatible with the web app. */
    fun newServerJson(name: String, user: JSONObject): JSONObject {
        val now = System.currentTimeMillis()
        val chanId = "chan-$now-general"
        return JSONObject().apply {
            put("id", "server-$now")
            put("name", name.trim())
            put("icon", "")
            put("description", "Created on OpenChat V2 for Android")
            put("ownerId", user.optString("id"))
            put("categories", JSONArray().apply {
                put(JSONObject().apply {
                    put("id", "cat-$now-1")
                    put("name", "TEXT CHANNELS")
                    put("channels", JSONArray().apply {
                        put(JSONObject().apply {
                            put("id", chanId)
                            put("name", "general")
                            put("type", "text")
                            put("topic", "Welcome!")
                            put("unreadCount", 0)
                        })
                    })
                })
                put(JSONObject().apply {
                    put("id", "cat-$now-2")
                    put("name", "VOICE CHANNELS")
                    put("channels", JSONArray().apply {
                        put(JSONObject().apply {
                            put("id", "chan-$now-voice")
                            put("name", "General Lounge")
                            put("type", "voice")
                            put("participants", JSONArray())
                        })
                    })
                })
            })
            put("members", JSONArray().apply {
                put(JSONObject().apply {
                    put("user", user)
                    put("roles", JSONArray().put("Owner"))
                    put("joinedAt", "Today")
                    put("isOwner", true)
                })
            })
        }
    }
}
