import Foundation

struct OcMessage: Identifiable {
    let id: String
    let authorId: String
    let authorUsername: String
    let authorDiscriminator: String
    let content: String
    let timestamp: String
}

struct OcChannel: Identifiable, Hashable {
    let id: String
    let name: String
    let type: String
}

struct OcServer: Identifiable {
    let id: String
    let name: String
    let channels: [OcChannel]
}

struct AppState {
    var servers: [OcServer]
    var messages: [String: [OcMessage]]
}

enum StateParser {
    static func message(from obj: [String: Any]) -> OcMessage {
        let author = obj["author"] as? [String: Any] ?? [:]
        return OcMessage(
            id: obj["id"] as? String ?? UUID().uuidString,
            authorId: author["id"] as? String ?? "",
            authorUsername: author["username"] as? String ?? "Unknown",
            authorDiscriminator: author["discriminator"] as? String ?? "0000",
            content: obj["content"] as? String ?? "",
            timestamp: obj["timestamp"] as? String ?? ""
        )
    }

    static func parse(_ state: [String: Any]?) -> AppState {
        guard let state else { return AppState(servers: [], messages: [:]) }

        var servers: [OcServer] = []
        if let arr = state["servers"] as? [[String: Any]] {
            for s in arr {
                var channels: [OcChannel] = []
                if let cats = s["categories"] as? [[String: Any]] {
                    for cat in cats {
                        if let ch = cat["channels"] as? [[String: Any]] {
                            for c in ch {
                                channels.append(OcChannel(
                                    id: c["id"] as? String ?? UUID().uuidString,
                                    name: c["name"] as? String ?? "general",
                                    type: c["type"] as? String ?? "text"
                                ))
                            }
                        }
                    }
                }
                servers.append(OcServer(
                    id: s["id"] as? String ?? UUID().uuidString,
                    name: s["name"] as? String ?? "Server",
                    channels: channels
                ))
            }
        }

        var messages: [String: [OcMessage]] = [:]
        if let m = state["messages"] as? [String: Any] {
            for (key, value) in m {
                if let arr = value as? [[String: Any]] {
                    messages[key] = arr.map(message(from:))
                }
            }
        }
        return AppState(servers: servers, messages: messages)
    }
}
