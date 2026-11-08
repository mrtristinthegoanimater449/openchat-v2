import SwiftUI
import AVFoundation
#if canImport(UIKit)
import UIKit
#endif

private let bg      = Color(red: 0x1e/255, green: 0x1f/255, blue: 0x22/255)
private let panel   = Color(red: 0x2b/255, green: 0x2d/255, blue: 0x31/255)
private let panel2  = Color(red: 0x31/255, green: 0x33/255, blue: 0x38/255)
private let accent  = Color(red: 0x58/255, green: 0x65/255, blue: 0xF2/255)
private let textHi  = Color(red: 0xF2/255, green: 0xF3/255, blue: 0xF5/255)
private let textMid = Color(red: 0xDB/255, green: 0xDE/255, blue: 0xE1/255)
private let textLo  = Color(red: 0x94/255, green: 0x9B/255, blue: 0xA4/255)
private let danger  = Color(red: 0xF2/255, green: 0x3F/255, blue: 0x43/255)

struct RootView: View {
    @State private var sessionUser: [String: Any]? = {
        guard let s = Api.userJSON,
              let data = s.data(using: .utf8),
              let obj = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else { return nil }
        return obj
    }()

    var body: some View {
        ZStack {
            bg.ignoresSafeArea()
            if sessionUser == nil {
                AuthView { user in
                    withAnimation { sessionUser = user }
                }
            } else {
                ChatView(user: Binding(get: { sessionUser! }, set: { sessionUser = $0 })) {
                    Api.logout()
                    withAnimation { sessionUser = nil }
                }
            }
        }
    }
}

// MARK: - Auth

struct AuthView: View {
    let onAuthenticated: ([String: Any]) -> Void

    @State private var mode: String = "signup"
    @State private var username = ""
    @State private var password = ""
    @State private var confirm = ""
    @State private var error: String?
    @State private var busy = false

    var body: some View {
        ScrollView {
            VStack(spacing: 16) {
                Spacer(minLength: 60)
                Text("OpenChat V2")
                    .font(.system(size: 34, weight: .heavy))
                    .foregroundColor(textHi)
                Text("Native iOS client — all data from your OpenChat server")
                    .font(.footnote)
                    .foregroundColor(textLo)

                HStack {
                    ForEach(["signup", "login"], id: \.self) { m in
                        Button(action: { withAnimation { mode = m; error = nil } }) {
                            Text(m == "signup" ? "Sign Up" : "Log In")
                                .fontWeight(.bold)
                                .frame(maxWidth: .infinity)
                                .padding(.vertical, 11)
                                .background(mode == m ? accent : Color.clear)
                                .foregroundColor(mode == m ? .white : textLo)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                    }
                }
                .padding(4)
                .background(panel)
                .clipShape(RoundedRectangle(cornerRadius: 12))

                TextField("Username", text: $username)
                    .textInputAutocapitalization(.never)
                    .foregroundColor(textHi)
                    .padding()
                    .background(panel)
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                SecureField("Password", text: $password)
                    .foregroundColor(textHi)
                    .padding()
                    .background(panel)
                    .clipShape(RoundedRectangle(cornerRadius: 10))

                if mode == "signup" {
                    SecureField("Confirm password", text: $confirm)
                        .foregroundColor(textHi)
                        .padding()
                        .background(panel)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                }

                if let error {
                    Text(error).font(.footnote).foregroundColor(danger).frame(maxWidth: .infinity, alignment: .leading)
                }

                Button(action: submit) {
                    Group {
                        if busy { ProgressView().tint(.white) }
                        else { Text(mode == "signup" ? "Create Account" : "Log In").fontWeight(.bold) }
                    }
                    .frame(maxWidth: .infinity)
                    .frame(height: 48)
                    .background(accent)
                    .foregroundColor(.white)
                    .clipShape(RoundedRectangle(cornerRadius: 10))
                }
                .disabled(busy || username.trimmingCharacters(in: .whitespaces).isEmpty || password.isEmpty)
            }
            .padding(.horizontal, 24)
        }
    }

    private func submit() {
        error = nil
        let u = username.trimmingCharacters(in: .whitespaces)
        if u.count < 2 { error = "Username must be at least 2 characters."; return }
        if password.count < 6 { error = "Password must be at least 6 characters."; return }
        if mode == "signup" && password != confirm { error = "Passwords do not match."; return }

        busy = true
        Task {
            let result = mode == "signup" ? await Api.register(username: u, password: password)
                                          : await Api.login(username: u, password: password)
            await MainActor.run {
                busy = false
                if result.success, let user = result.user {
                    onAuthenticated(user)
                } else {
                    error = result.message
                }
            }
        }
    }
}

// MARK: - Global Chat

struct ChatView: View {
    @Binding var user: [String: Any]
    let onLogout: () -> Void

    @State private var messages: [OcMessage] = []
    @State private var messageText = ""
    @State private var status = "Syncing…"
    @State private var busy = false
    @State private var musicOn = false
    @State private var musicBusy = false
    @State private var musicPlayer: AVPlayer?

    private var userID: String { user["id"] as? String ?? "" }
    private var username: String { user["username"] as? String ?? "You" }
    private var discriminator: String { user["discriminator"] as? String ?? "0000" }

    private func toggleMusic() {
        if musicOn {
            musicPlayer?.pause()
            musicPlayer = nil
            musicOn = false
            return
        }
        musicBusy = true
        Task {
            guard let url = await Api.musicStreamURL() else {
                await MainActor.run {
                    musicBusy = false
                    status = "Couldn't stream music"
                }
                return
            }
            await MainActor.run {
                musicBusy = false
                let item = AVPlayerItem(url: url)
                musicPlayer = AVPlayer(playerItem: item)
                musicPlayer?.volume = 0.8
                musicPlayer?.play()
                musicOn = true
                status = "Streaming music"
                NotificationCenter.default.addObserver(forName: .AVPlayerItemDidPlayToEndTime, object: item, queue: .main) { _ in
                    musicPlayer?.seek(to: .zero)
                    musicPlayer?.play()
                }
            }
        }
    }



    var body: some View {
        VStack(spacing: 0) {
            // Top bar
            HStack {
                Circle().fill(Color.green).frame(width: 9, height: 9)
                Text("\(username)#\(discriminator)").font(.footnote.bold()).foregroundColor(textMid)
                    .lineLimit(1)
                Spacer()
                Button(musicOn ? "⏹ Stop" : "Music") { toggleMusic() }.font(.footnote).foregroundColor(accent)
                Button("Refresh") { refresh() }.font(.footnote).foregroundColor(accent)
                Button("Log out") { onLogout() }.font(.footnote).foregroundColor(danger)
            }
            .padding(.horizontal, 12).padding(.vertical, 10)
            .background(panel)

            Text("Global chat")
                .font(.caption.bold())
                .foregroundColor(textLo)
                .frame(maxWidth: .infinity, alignment: .leading)
                .padding(.horizontal, 16).padding(.vertical, 6)

            ScrollView {
                LazyVStack(alignment: .leading, spacing: 10) {
                    if messages.isEmpty {
                        Text("No messages yet — say hi!")
                            .font(.footnote).foregroundColor(textLo).padding(.top, 24)
                    }
                    ForEach(messages) { msg in
                        MessageRow(msg: msg, isOwn: msg.authorId == userID, accent: accent,
                                   textHi: textHi, textMid: textMid, textLo: textLo, panel: panel)
                    }
                }
                .padding(12)
            }

            // Composer
            HStack(spacing: 8) {
                TextField("Message everyone", text: $messageText)
                    .foregroundColor(textHi)
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(panel).clipShape(Capsule())
                    .onSubmit(sendMessage)
                Button(action: sendMessage) {
                    Text("Send").fontWeight(.bold).foregroundColor(.white)
                        .padding(.horizontal, 16).padding(.vertical, 10)
                        .background(accent).clipShape(Capsule())
                }
                .disabled(busy || messageText.trimmingCharacters(in: .whitespaces).isEmpty)
            }
            .padding(10)
        }
        .background(bg.ignoresSafeArea())
        .onAppear { refresh() }
    }

    private func refresh() {
        Task {
            await MainActor.run { busy = true; status = "Syncing…" }
            let me = await Api.me()
            let state = await Api.fetchState()
            await MainActor.run {
                busy = false
                if let me {
                    user = me
                    Api.userJSON = (try? String(data: JSONSerialization.data(withJSONObject: me), encoding: .utf8)) ?? Api.userJSON
                    status = "Connected"
                } else {
                    status = "Can't reach server"
                }
                messages = StateParser.globalMessages(state: state)
                Api.stateJSON = state.flatMap { try? String(data: JSONSerialization.data(withJSONObject: $0), encoding: .utf8) }
            }
        }
    }

    private func sendMessage() {
        let content = messageText.trimmingCharacters(in: .whitespaces)
        guard !content.isEmpty else { return }

        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        let msg: [String: Any] = [
            "id": "msg-\(Int(Date().timeIntervalSince1970 * 1000))",
            "channelId": "global",
            "author": user,
            "content": content,
            "timestamp": "Today at \(formatter.string(from: Date()))",
            "reactions": [[String: Any]]()
        ]

        var stateObj: [String: Any] = {
            if let s = Api.stateJSON, let d = s.data(using: .utf8),
               let o = try? JSONSerialization.jsonObject(with: d) as? [String: Any] { return o }
            return [:]
        }()
        var m = stateObj["messages"] as? [String: Any] ?? [:]
        var arr = m["global"] as? [[String: Any]] ?? []
        arr.append(msg)
        m["global"] = arr
        stateObj["messages"] = m

        busy = true
        Task {
            let ok = await Api.saveState(stateObj)
            await MainActor.run {
                busy = false
                if ok {
                    Api.stateJSON = try? String(data: JSONSerialization.data(withJSONObject: stateObj), encoding: .utf8)
                    messages = StateParser.globalMessages(state: stateObj)
                    messageText = ""
                } else {
                    status = "Failed to sync message"
                }
            }
        }
    }
}

struct MessageRow: View {
    let msg: OcMessage
    let isOwn: Bool
    let accent: Color, textHi: Color, textMid: Color, textLo: Color, panel: Color

    var body: some View {
        HStack(alignment: .top, spacing: 10) {
            ZStack {
                Circle().fill(isOwn ? accent : panel).frame(width: 34, height: 34)
                Text(String(msg.authorUsername.prefix(1)).uppercased())
                    .font(.footnote.bold()).foregroundColor(.white)
            }
            VStack(alignment: .leading, spacing: 2) {
                HStack(spacing: 6) {
                    Text(msg.authorUsername).font(.footnote.bold()).foregroundColor(isOwn ? accent : textHi)
                    Text(msg.timestamp).font(.caption2).foregroundColor(textLo)
                }
                Text(msg.content).font(.callout).foregroundColor(textMid)
            }
        }
    }
}
