package app.openchat.v2

import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.widget.Toast
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
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
private val RailBg    = Color(0xFF1E1F22)
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
    val activity = context as? ComponentActivity

    var serverUrl by remember { mutableStateOf(Api.getServerUrl(context)) }
    var showServerSettings by remember { mutableStateOf(false) }
    var serverStatus by remember { mutableStateOf<String?>(null) }
    var busy by remember { mutableStateOf(false) }

    var username by remember { mutableStateOf("") }
    var password by remember { mutableStateOf("") }
    var confirmPassword by remember { mutableStateOf("") }
    var authMode by remember { mutableStateOf("signup") } // signup | login
    var authError by remember { mutableStateOf<String?>(null) }

    var sessionUser by remember { mutableStateOf(Api.getUserJson(context)?.let { JSONObject(it) }) }
    var rawState by remember {
        mutableStateOf(Api.getStateJson(context)?.let { runCatching { JSONObject(it) }.getOrNull() })
    }
    var appState by remember { mutableStateOf(Models.parseState(rawState)) }
    var selectedServerId by remember { mutableStateOf<String?>(null) }
    var selectedChannelId by remember { mutableStateOf<String?>(null) }
    var messageInput by remember { mutableStateOf("") }
    var showCreateServer by remember { mutableStateOf(false) }
    var newServerName by remember { mutableStateOf("") }

    val mainHandler = remember { Handler(Looper.getMainLooper()) }

    fun toast(msg: String) = Toast.makeText(context, msg, Toast.LENGTH_SHORT).show()

    fun applyRawState(state: JSONObject?) {
        rawState = state
        Api.setStateJson(context, state?.toString())
        appState = Models.parseState(state)
        // Keep selection valid
        if (appState.servers.none { it.id == selectedServerId }) {
            selectedServerId = appState.servers.firstOrNull()?.id
        }
        val server = appState.servers.find { it.id == selectedServerId }
        if (server != null && server.channels.none { it.id == selectedChannelId }) {
            selectedChannelId = server.channels.firstOrNull { it.type == "text" }?.id
                ?: server.channels.firstOrNull()?.id
        }
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
                        applyRawState(state)
                        serverStatus = "Connected to ${Api.getServerUrl(context)}"
                        busy = false
                    }
                } else {
                    mainHandler.post {
                        Api.setToken(context, null)
                        sessionUser = null
                        serverStatus = "Session expired — sign in again"
                        busy = false
                    }
                }
            } catch (e: Exception) {
                mainHandler.post {
                    serverStatus = "Can't reach ${Api.getServerUrl(context)}"
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
                        Api.setUserJson(context, res.getJSONObject("user").toString())
                        sessionUser = res.getJSONObject("user")
                        refreshFromServer()
                    } else {
                        authError = res.optString("message", "Authentication failed.")
                    }
                }
            } catch (e: Exception) {
                mainHandler.post {
                    busy = false
                    authError = "Can't reach ${Api.getServerUrl(context)}: ${e.message}"
                }
            }
        }.start()
    }

    fun sendMessage() {
        val content = messageInput.trim()
        val channelId = selectedChannelId ?: return
        val user = sessionUser ?: return
        if (content.isEmpty()) return

        val sdf = SimpleDateFormat("h:mm a", Locale.US)
        val now = System.currentTimeMillis()
        val msg = JSONObject().apply {
            put("id", "msg-$now")
            put("channelId", channelId)
            put("author", user)
            put("content", content)
            put("timestamp", "Today at " + sdf.format(Date(now)))
            put("reactions", JSONArray())
        }

        val state = rawState?.let { JSONObject(it.toString()) } ?: JSONObject()
        val messagesObj = state.optJSONObject("messages") ?: JSONObject().also { state.put("messages", it) }
        val arr = messagesObj.optJSONArray(channelId) ?: JSONArray().also { messagesObj.put(channelId, it) }
        arr.put(msg)

        busy = true
        Thread {
            val ok = Api.saveState(context, state)
            mainHandler.post {
                busy = false
                if (ok) {
                    applyRawState(state)
                    messageInput = ""
                } else {
                    toast("Failed to sync message — is the server reachable?")
                }
            }
        }.start()
    }

    fun createServer() {
        val name = newServerName.trim()
        val user = sessionUser ?: return
        if (name.isEmpty()) return

        val serverJson = Models.newServerJson(name, user)
        val state = rawState?.let { JSONObject(it.toString()) } ?: JSONObject()
        val servers = state.optJSONArray("servers") ?: JSONArray().also { state.put("servers", it) }
        servers.put(serverJson)
        if (!state.has("messages")) state.put("messages", JSONObject())
        if (!state.has("friends")) state.put("friends", JSONArray())

        busy = true
        Thread {
            val ok = Api.saveState(context, state)
            mainHandler.post {
                busy = false
                showCreateServer = false
                newServerName = ""
                if (ok) {
                    applyRawState(state)
                    selectedServerId = serverJson.getString("id")
                    val server = appState.servers.find { it.id == selectedServerId }
                    selectedChannelId = server?.channels?.firstOrNull { it.type == "text" }?.id
                    toast("Server created")
                } else {
                    toast("Couldn't create server — sync failed")
                }
            }
        }.start()
    }

    fun logout() {
        Thread { Api.logout(context) }.start()
        Api.setToken(context, null)
        Api.setUserJson(context, null)
        sessionUser = null
        serverStatus = null
        password = ""
        confirmPassword = ""
    }

    // ---------- UI ----------
    Surface(modifier = Modifier.fillMaxSize(), color = Bg) {

        // ---------- SETUP + AUTH ----------
        if (sessionUser == null) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(24.dp),
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center
            ) {
                Text("OpenChat V2", color = TextHi, fontSize = 32.sp, fontWeight = FontWeight.ExtraBold)
                Spacer(Modifier.height(4.dp))
                Text("Native client — all data from your OpenChat server", color = TextLo, fontSize = 13.sp)
                Spacer(Modifier.height(24.dp))

                // Server is pre-configured — no entry required. Toggle only if you need to change it.
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Box(
                        modifier = Modifier.size(8.dp).clip(CircleShape).background(Green)
                    )
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
                        serverStatus = "Saved: ${Api.getServerUrl(context)}"
                    }) { Text("Save server URL", color = Accent) }
                    serverStatus?.let { Text(it, color = TextLo, fontSize = 11.sp) }
                }

                Spacer(Modifier.height(20.dp))

                // Auth mode tabs
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

        // ---------- MAIN APP ----------
        Column(modifier = Modifier.fillMaxSize().background(Bg)) {
            // Top bar
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(PanelBg)
                    .padding(horizontal = 12.dp, vertical = 8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .clip(CircleShape)
                        .background(if (serverStatus?.startsWith("Connected") == true) Green else TextLo)
                )
                Spacer(Modifier.width(8.dp))
                Text(
                    sessionUser.optString("username") + "#" + sessionUser.optString("discriminator"),
                    color = TextMid,
                    fontSize = 13.sp,
                    modifier = Modifier.weight(1f),
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                TextButton(onClick = { refreshFromServer() }) { Text("Sync", color = Accent, fontSize = 13.sp) }
                TextButton(onClick = { logout() }) { Text("Log out", color = Danger, fontSize = 13.sp) }
            }

            if (appState.servers.isEmpty()) {
                // Empty state — create a server natively
                Column(
                    modifier = Modifier.fillMaxSize().padding(24.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.Center
                ) {
                    Text("#", color = TextLo, fontSize = 64.sp, fontWeight = FontWeight.ExtraBold)
                    Spacer(Modifier.height(8.dp))
                    Text("No servers yet", color = TextHi, fontSize = 20.sp, fontWeight = FontWeight.Bold)
                    Text("Create your first server — it syncs to your account.", color = TextLo, fontSize = 13.sp)
                    Spacer(Modifier.height(20.dp))
                    Button(
                        onClick = { showCreateServer = true },
                        colors = ButtonDefaults.buttonColors(containerColor = Accent)
                    ) { Text("Create your first server", fontWeight = FontWeight.Bold) }
                }
            } else {
                Row(modifier = Modifier.fillMaxSize()) {
                    // Server rail
                    LazyColumn(
                        modifier = Modifier.fillMaxHeight().width(64.dp).background(RailBg),
                        contentPadding = PaddingValues(vertical = 8.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp),
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        items(appState.servers, key = { it.id }) { server ->
                            val active = server.id == selectedServerId
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(RoundedCornerShape(if (active) 14.dp else 23.dp))
                                    .background(if (active) Accent else PanelBg2)
                                    .clickable {
                                        selectedServerId = server.id
                                        selectedChannelId = server.channels.firstOrNull { it.type == "text" }?.id
                                            ?: server.channels.firstOrNull()?.id
                                    },
                                contentAlignment = Alignment.Center
                            ) {
                                Text(
                                    server.name.take(2).uppercase(Locale.US),
                                    color = if (active) Color.White else TextMid,
                                    fontWeight = FontWeight.Bold,
                                    fontSize = 16.sp
                                )
                            }
                        }
                        item {
                            Box(
                                modifier = Modifier
                                    .size(46.dp)
                                    .clip(CircleShape)
                                    .background(PanelBg2)
                                    .clickable { showCreateServer = true },
                                contentAlignment = Alignment.Center
                            ) { Text("+", color = Green, fontSize = 24.sp, fontWeight = FontWeight.Bold) }
                        }
                    }

                    // Chat pane
                    val server = appState.servers.find { it.id == selectedServerId }
                    val channel = server?.channels?.find { it.id == selectedChannelId }
                    val messages = channel?.let { appState.messages[it.id] } ?: emptyList()

                    Column(modifier = Modifier.fillMaxSize().background(PanelBg2)) {
                        // Channel chips
                        if (server != null) {
                            LazyRow(
                                modifier = Modifier.fillMaxWidth().padding(horizontal = 10.dp, vertical = 8.dp),
                                horizontalArrangement = Arrangement.spacedBy(6.dp)
                            ) {
                                items(server.channels) { ch ->
                                    val active = ch.id == selectedChannelId
                                    val prefix = if (ch.type == "voice" || ch.type == "stage") "🔊 " else "# "
                                    Box(
                                        modifier = Modifier
                                            .clip(RoundedCornerShape(16.dp))
                                            .background(if (active) Accent else PanelBg)
                                            .clickable { selectedChannelId = ch.id }
                                            .padding(horizontal = 12.dp, vertical = 6.dp)
                                    ) {
                                        Text(prefix + ch.name, color = if (active) Color.White else TextLo, fontSize = 13.sp)
                                    }
                                }
                            }
                        }

                        // Messages
                        LazyColumn(
                            modifier = Modifier.weight(1f).fillMaxWidth().padding(horizontal = 12.dp),
                            verticalArrangement = Arrangement.spacedBy(8.dp),
                            reverseLayout = false
                        ) {
                            if (messages.isEmpty()) {
                                item {
                                    Text(
                                        "No messages yet in #${channel?.name ?: "channel"} — say hi!",
                                        color = TextLo,
                                        fontSize = 13.sp,
                                        modifier = Modifier.padding(top = 24.dp)
                                    )
                                }
                            }
                            items(messages, key = { it.id }) { msg ->
                                val own = msg.authorId == sessionUser.optString("id")
                                Row(verticalAlignment = Alignment.Top) {
                                    Box(
                                        modifier = Modifier.size(36.dp).clip(CircleShape)
                                            .background(if (own) Accent else PanelBg),
                                        contentAlignment = Alignment.Center
                                    ) {
                                        Text(msg.authorUsername.take(1).uppercase(Locale.US), color = Color.White, fontWeight = FontWeight.Bold)
                                    }
                                    Spacer(Modifier.width(8.dp))
                                    Column {
                                        Row(verticalAlignment = Alignment.CenterVertically) {
                                            Text(msg.authorUsername, color = if (own) Accent else TextHi, fontWeight = FontWeight.SemiBold, fontSize = 13.sp)
                                            Spacer(Modifier.width(6.dp))
                                            Text(msg.timestamp, color = TextLo, fontSize = 10.sp)
                                        }
                                        Spacer(Modifier.height(2.dp))
                                        Text(msg.content, color = TextMid, fontSize = 14.sp)
                                    }
                                }
                            }
                        }

                        // Composer
                        Row(
                            modifier = Modifier.fillMaxWidth().padding(10.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = messageInput,
                                onValueChange = { messageInput = it },
                                placeholder = { Text("Message #${channel?.name ?: ""}") },
                                singleLine = true,
                                modifier = Modifier.weight(1f),
                                colors = fieldColors(),
                                shape = RoundedCornerShape(20.dp)
                            )
                            Spacer(Modifier.width(8.dp))
                            Button(
                                onClick = { sendMessage() },
                                enabled = !busy && messageInput.isNotBlank() && selectedChannelId != null,
                                colors = ButtonDefaults.buttonColors(containerColor = Accent),
                                shape = RoundedCornerShape(20.dp)
                            ) { Text("Send", fontWeight = FontWeight.Bold) }
                        }
                    }
                }
            }
        }
    }

    // Create server dialog
    if (showCreateServer) {
        AlertDialog(
            onDismissRequest = { showCreateServer = false },
            containerColor = PanelBg,
            title = { Text("Create a server", color = TextHi) },
            text = {
                OutlinedTextField(
                    value = newServerName,
                    onValueChange = { newServerName = it },
                    label = { Text("Server name") },
                    singleLine = true,
                    colors = fieldColors()
                )
            },
            confirmButton = {
                TextButton(onClick = { createServer() }) { Text("Create", color = Accent, fontWeight = FontWeight.Bold) }
            },
            dismissButton = {
                TextButton(onClick = { showCreateServer = false }) { Text("Cancel", color = TextLo) }
            }
        )
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
