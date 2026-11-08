package app.openchat.v2

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.PasswordVisualTransformation
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import org.json.JSONArray
import org.json.JSONObject
import java.text.SimpleDateFormat
import java.util.Date
import java.util.Locale

private val Bg        = Color(0xFF1E1F22)
private val PanelBg   = Color(0xFF2B2D31)
private val PanelBg2  = Color(0xFF313338)
private val HoverBg   = Color(0xFF35373C)
private val Accent    = Color(0xFF5865F2)
private val TextHi    = Color(0xFFF2F3F5)
private val TextMid   = Color(0xFFDBDEE1)
private val TextLo    = Color(0xFF949BA4)
private val Danger    = Color(0xFFF23F43)
private val Green     = Color(0xFF23A559)

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent { OpenChatApp() }
    }
}

@Composable
fun OpenChatApp() {
    val context = androidx.compose.ui.platform.LocalContext.current

    var serverUrl by remember { mutableStateOf(Api.getServerUrl(context)) }
    var showServerSettings by remember { mutableStateOf(false) }
    var status by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var authMode by remember { mutableStateOf("signup") }
    var authError by remember { mutableStateOf<String?>(null) }

    var sessionUser by remember { mutableStateOf(Api.getUserJson(context)?.let { JSONObject(it) }) }
    var rawState by remember {
        mutableStateOf(Api.getStateJson(context)?.let { runCatching { JSONObject(it) }.getOrNull() })
    }
    var messages by remember { mutableStateOf(Models.globalMessages(rawState)) }
    var messageInput by remember { mutableStateOf("") }

    val mainHandler = remember { Handler(Looper.getMainLooper()) }

    fun toast(msg: String) = Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()

    fun applyState(state: JSONObject?) {
        rawState = state
        Api.setStateJson(context, state?.toString())
        messages = Models.globalMessages(state)
    }

    fun refreshFromServer() {
        busy = true
        Thread {
            try {
                val me = Api.me(context)
                if (me.optInt("_http") == 200 && me.optBoolean("success", false)) {
                    val user = me.getJSONObject("user")
                    val state = Api.fetchState(context)
                    mainHandler.post {
                        sessionUser = user
                        Api.setUserJson(context, user.toString())
                        applyState(state)
                        status = "Connected"
                        busy = false
                    }
                } else {
                    mainHandler.post {
                        Api.setToken(context, null)
                        sessionUser = null
                        status = "Session expired — sign in again"
                        busy = false
                    }
                }
            } catch (e: Exception) {
                mainHandler.post {
                    status = "Can't reach ${Api.getServerUrl(context)}"
                    busy = false
                }
            }
        }.start()
    }

    fun doAuth() {
        authError = null
        val u = username.trim()
        if (u.length < 2) { authError = "Username must be at least 2 characters."; return }
        if (password.length < 6) { authError = "Password must be at least 6 characters."; return }
        if (authMode == "signup" && password != confirmPassword) { authError = "Passwords do not match."; return }

        busy = true
        Thread {
            try {
                val res = if (authMode == "signup") Api.register(context, u, password)
                          else Api.login(context, u, password)
                mainHandler.post {
                    busy = false
                    if (res.optBoolean("success", false)) {
                        Api.setToken(context, res.getString("token"))
                        val user = res.getJSONObject("user")
                        Api.setUserJson(context, user.toString())
                        sessionUser = user
                        refreshFromServer()
                    } else {
                        authError = res.optString("message", "Authentication failed.")
                    }
                }
            } catch (e: Exception) {
                mainHandler.post {
                    busy = false
                    authError = "Can't reach ${Api.getServerUrl(context)}"
                }
            }
        }.start()
    }

    fun sendMessage() {
        val content = messageInput.trim()
        val user = sessionUser ?: return
        if (content.isEmpty()) return

        val sdf = SimpleDateFormat("h:mm a", Locale.US)
        val now = System.currentTimeMillis()
        val msg = JSONObject().apply {
            put("id", "msg-$now")
            put("channelId", "global")
            put("author", user)
            put("content", content)
            put("timestamp", "Today at " + sdf.format(Date(now)))
            put("reactions", JSONArray())
        }

        val state = rawState?.let { JSONObject(it.toString()) } ?: JSONObject()
        val messagesObj = state.optJSONObject("messages") ?: JSONObject().also { state.put("messages", it) }
        val arr = messagesObj.optJSONArray("global") ?: JSONArray().also { messagesObj.put("global", it) }
        arr.put(msg)

        busy = true
        Thread {
            val ok = Api.saveState(context, state)
            mainHandler.post {
                busy = false
                if (ok) {
                    applyState(state)
                    messageInput = ""
                } else {
                    toast("Failed to sync message — is the server reachable?")
                }
            }
        }.start()
    }

    fun logout() {
        Thread { Api.logout(context) }.start()
        Api.setToken(context, null)
        Api.setUserJson(context, null)
        sessionUser = null
        password = ""
        confirmPassword = ""
    }

    Surface(modifier = Modifier.fillMaxSize(), color = Bg) {

        // ---------- SETUP + AUTH ----------
        if (sessionUser == null) {
            Column(
                modifier = Modifier.fillMaxSize().padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text("OpenChat V2", color = TextHi, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(4.dp))
                Text("Native client — all data from your OpenChat server", color = TextLo, fontSize = 13.sp)
                Spacer(Modifier.height(24.dp))

                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(modifier = Modifier.size(8.dp).clip(CircleShape).background(Green))
                    Spacer(Modifier.width(6.dp))
                    Text("Connected to OpenChat server", color = TextLo, fontSize = 12.sp)
                    Spacer(Modifier.width(8.dp))
                    TextButton(onClick = { showServerSettings = !showServerSettings }) {
                        Text(if (showServerSettings) "Hide" else "Change", color = TextLo, fontSize = 11.sp)
                    }
                }
                if (showServerSettings) {
                    Spacer(Modifier.height(6.dp))
                    OutlinedTextField(
                        value = serverUrl,
                        onValueChange = { serverUrl = it },
                        label = { Text("Server URL") },
                        singleLine = true,
                        modifier = Modifier.fillMaxWidth(),
                        colors = fieldColors()
                    )
                    TextButton(onClick = {
                        Api.setServerUrl(context, serverUrl)
                        status = "Saved: ${Api.getServerUrl(context)}"
                    }) { Text("Save server URL", color = Accent) }
                    status?.let { Text(it, color = TextLo, fontSize = 11.sp) }
                }

                Spacer(Modifier.height(20.dp))

                Row(modifier = Modifier.fillMaxWidth().clip(RoundedCornerShape(10.dp)).background(PanelBg)) {
                    listOf("signup" to "Sign Up", "login" to "Log In").forEach { (mode, label) ->
                        val selected = authMode == mode
                        Box(
                            modifier = Modifier
                                .weight(1f)
                                .background(if (selected) Accent else Color.Transparent)
                                .clickable { authMode = mode; authError = null }
                                .padding(vertical = 12.dp),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(label, color = if (selected) Color.White else TextLo, fontWeight = FontWeight.Bold)
                        }
                    }
                }
                Spacer(Modifier.height(14.dp))

                OutlinedTextField(
                    value = username,
                    onValueChange = { username = it },
                    label = { Text("Username") },
                    singleLine = true,
                    modifier = Modifier.fillMaxWidth(),
                    colors = fieldColors()
                )
                Spacer(Modifier.height(10.dp))
                OutlinedTextField(
                    value = password,
                    onValueChange = { password = it },
                    label = { Text("Password") },
                    singleLine = true,
                    visualTransformation = PasswordVisualTransformation(),
                    modifier = Modifier.fillMaxWidth(),
                    colors = fieldColors()
                )
                if (authMode == "signup") {
                    Spacer(Modifier.height(10.dp))
                    OutlinedTextField(
                        value = confirmPassword,
                        onValueChange = { confirmPassword = it },
                        label = { Text("Confirm password") },
                        singleLine = true,
                        visualTransformation = PasswordVisualTransformation(),
                        modifier = Modifier.fillMaxWidth(),
                        colors = fieldColors()
                    )
                }
                authError?.let {
                    Spacer(Modifier.height(8.dp))
                    Text(it, color = Danger, fontSize = 12.sp)
                }
                Spacer(Modifier.height(16.dp))
                Button(
                    onClick = {
                        Api.setServerUrl(context, serverUrl)
                        doAuth()
                    },
                    enabled = !busy && username.isNotBlank() && password.isNotBlank(),
                    modifier = Modifier.fillMaxWidth().height(48.dp),
                    colors = ButtonDefaults.buttonColors(containerColor = Accent)
                ) {
                    Text(if (authMode == "signup") "Create Account" else "Log In", fontWeight = FontWeight.Bold)
                }
            }
            return@Surface
        }

        // ---------- GLOBAL CHAT ----------
        val currentUser = sessionUser ?: return@Surface

        Column(modifier = Modifier.fillMaxSize().background(Bg)) {
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PanelBg)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(modifier = Modifier.size(10.dp).clip(CircleShape).background(Green))
                Spacer(Modifier.width(8.dp))
                Text(
                    currentUser.optString("username") + "#" + currentUser.optString("discriminator"),
                    color = TextMid, fontSize = 13.sp, modifier = Modifier.weight(1f),
                    maxLines = 1, overflow = TextOverflow.Ellipsis
                )
                TextButton(onClick = { refreshFromServer() }) { Text("Refresh", color = Accent, fontSize = 13.sp) }
                TextButton(onClick = { logout() }) { Text("Log out", color = Danger, fontSize = 13.sp) }
            }

            Text(
                "Global chat",
                color = TextLo, fontSize = 12.sp, fontWeight = FontWeight.Bold,
                modifier = Modifier.padding(start = 16.dp, top = 8.dp)
            )

            LazyColumn(
                modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 12.dp, vertical = 8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                if (messages.isEmpty()) {
                    item {
                        Text(
                            "No messages yet — say hi!",
                            color = TextLo, fontSize = 13.sp, modifier = Modifier.padding(top = 24.dp)
                        )
                    }
                }
                items(messages, key = { it.id }) { msg ->
                    val own = msg.authorId == currentUser.optString("id")
                    Row(verticalAlignment = Alignment.Top) {
                        Box(
                            modifier = Modifier.size(34.dp).clip(CircleShape)
                                .background(if (own) Accent else PanelBg),
                            contentAlignment = Alignment.Center
                        ) {
                            Text(
                                msg.authorUsername.take(1).uppercase(Locale.US),
                                color = Color.White, fontWeight = FontWeight.Bold
                            )
                        }
                        Spacer(Modifier.width(8.dp))
                        Column {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(msg.authorUsername, color = if (own) Accent else TextHi,
                                    fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                Spacer(Modifier.width(6.dp))
                                Text(msg.timestamp, color = TextLo, fontSize = 10.sp)
                            }
                            Spacer(Modifier.height(2.dp))
                            Text(msg.content, color = TextMid, fontSize = 14.sp)
                        }
                    }
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth().padding(10.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                OutlinedTextField(
                    value = messageInput,
                    onValueChange = { messageInput = it },
                    placeholder = { Text("Message everyone") },
                    singleLine = true,
                    modifier = Modifier.weight(1f),
                    colors = fieldColors(),
                    shape = RoundedCornerShape(20.dp)
                )
                Spacer(Modifier.width(8.dp))
                Button(
                    onClick = { sendMessage() },
                    enabled = !busy && messageInput.isNotBlank(),
                    colors = ButtonDefaults.buttonColors(containerColor = Accent),
                    shape = RoundedCornerShape(20.dp)
                ) { Text("Send", fontWeight = FontWeight.Bold) }
            }
        }
    }
}

@Composable
private fun fieldColors() = OutlinedTextFieldDefaults.colors(
    focusedTextColor = TextHi,
    unfocusedTextColor = TextMid,
    focusedBorderColor = Accent,
    unfocusedBorderColor = HoverBg,
    cursorColor = Accent,
    focusedPlaceholderColor = TextLo,
    unfocusedPlaceholderColor = TextLo,
    focusedLabelColor = TextLo,
    unfocusedLabelColor = TextLo
)
