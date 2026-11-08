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

    private fun parseMessage(obj: JSONObject): Message = Message(
        id = obj.optString("id"),
        authorId = obj.optJSONObject("author")?.optString("id") ?: "",
        authorUsername = obj.optJSONObject("author")?.optString("username") ?: "Unknown",
        authorDiscriminator = obj.optJSONObject("author")?.optString("discriminator") ?: "0000",
        authorAvatar = obj.optJSONObject("author")?.optString("avatar") ?: "",
        content = obj.optString("content"),
        timestamp = obj.optString("timestamp")
    )

    /** Returns the global message list from a /api/state blob. */
    fun globalMessages(state: JSONObject?): List<Message> {
        if (state == null) return emptyList()
        val arr = state.optJSONObject("messages")?.optJSONArray("global") ?: return emptyList()
        val out = mutableListOf<Message>()
        for (i in 0 until arr.length()) out += parseMessage(arr.getJSONObject(i))
        return out
    }

    /** Build a minimal state blob compatible with the web/iOS apps. */
    fun buildState(messages: List<JSONObject>): JSONObject = JSONObject().put(
        "messages",
        JSONObject().put("global", JSONArray(messages))
    )
}
