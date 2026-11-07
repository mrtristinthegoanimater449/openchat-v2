import Foundation

/// Minimal JSON-over-HTTP client for the OpenChat V2 server.
/// All data (accounts, app state) comes from the server.
enum Api {
    static let defaultServerURL = "https://lid-graduation-automotive-mere.trycloudflare.com"

    private static var serverURL: String {
        UserDefaults.standard.string(forKey: "server_url") ?? defaultServerURL
    }

    static func setServerURL(_ url: String) {
        let trimmed = url.trimmingCharacters(in: .whitespacesAndNewlines).trimmingCharacters(in: CharacterSet(charactersIn: "/"))
        UserDefaults.standard.set(trimmed.isEmpty ? defaultServerURL : trimmed, forKey: "server_url")
    }

    static var token: String? {
        get { UserDefaults.standard.string(forKey: "token") }
        set { UserDefaults.standard.set(newValue, forKey: "token") }
    }

    static var userJSON: String? {
        get { UserDefaults.standard.string(forKey: "user_json") }
        set { UserDefaults.standard.set(newValue, forKey: "user_json") }
    }

    static var stateJSON: String? {
        get { UserDefaults.standard.string(forKey: "state_json") }
        set { UserDefaults.standard.set(newValue, forKey: "state_json") }
    }

    @discardableResult
    static func request(_ method: String, path: String, body: [String: Any]? = nil, auth: Bool = true) async throws -> (Int, Data) {
        guard let url = URL(string: serverURL + path) else { throw URLError(.badURL) }
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.timeoutInterval = 15
        req.setValue("application/json", forHTTPHeaderField: "Accept")
        if let body {
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
            req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        }
        if auth, let token {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        let (data, response) = try await URLSession.shared.data(for: req)
        let code = (response as? HTTPURLResponse)?.statusCode ?? -1
        return (code, data)
    }

    struct AuthResult { let success: Bool; let message: String?; let user: [String: Any]? }

    static func register(username: String, password: String) async -> AuthResult {
        do {
            let (code, data) = try await request("POST", path: "/api/auth/register",
                                                 body: ["username": username, "password": password], auth: false)
            let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
            if code == 200, let obj, obj["success"] as? Bool == true {
                token = obj["token"] as? String
                if let user = obj["user"] as? [String: Any] {
                    userJSON = try? String(data: JSONSerialization.data(withJSONObject: user), encoding: .utf8)
                    return AuthResult(success: true, message: nil, user: user)
                }
            }
            return AuthResult(success: false, message: obj?["message"] as? String ?? "Sign up failed", user: nil)
        } catch {
            return AuthResult(success: false, message: "Can't reach \(serverURL): \(error.localizedDescription)", user: nil)
        }
    }

    static func login(username: String, password: String) async -> AuthResult {
        do {
            let (code, data) = try await request("POST", path: "/api/auth/login",
                                                 body: ["username": username, "password": password], auth: false)
            let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any]
            if code == 200, let obj, obj["success"] as? Bool == true {
                token = obj["token"] as? String
                if let user = obj["user"] as? [String: Any] {
                    userJSON = try? String(data: JSONSerialization.data(withJSONObject: user), encoding: .utf8)
                    return AuthResult(success: true, message: nil, user: user)
                }
            }
            return AuthResult(success: false, message: obj?["message"] as? String ?? "Log in failed", user: nil)
        } catch {
            return AuthResult(success: false, message: "Can't reach \(serverURL): \(error.localizedDescription)", user: nil)
        }
    }

    static func me() async -> [String: Any]? {
        guard let (code, data) = try? await request("GET", path: "/api/auth/me"), code == 200,
              let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any],
              obj["success"] as? Bool == true else { return nil }
        return obj["user"] as? [String: Any]
    }

    static func logout() {
        Task { _ = try? await request("POST", path: "/api/auth/logout", body: [:]) }
        token = nil
        userJSON = nil
    }

    /// Returns the server's copy of app state, or nil if none saved yet.
    static func fetchState() async -> [String: Any]? {
        guard let (code, data) = try? await request("GET", path: "/api/state"), code == 200,
              let obj = (try? JSONSerialization.jsonObject(with: data)) as? [String: Any] else { return nil }
        if obj["state"] is NSNull || obj["state"] == nil { return nil }
        return obj["state"] as? [String: Any]
    }

    @discardableResult
    static func saveState(_ state: [String: Any]) async -> Bool {
        guard let (code, _) = try? await request("PUT", path: "/api/state", body: ["state": state]) else { return false }
        return (200..<300).contains(code)
    }
}
