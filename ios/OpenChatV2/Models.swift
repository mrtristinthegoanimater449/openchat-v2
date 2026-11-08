import Foundation

struct OcMessage: Identifiable {
    let id: String
    let authorId: String
    let authorUsername: String
    let authorDiscriminator: String
    let content: String
    let timestamp: String
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

    /// Returns the global message list from a /api/state blob.
    static func globalMessages(state: [String: Any]?) -> [OcMessage] {
        guard let state,
              let messages = state["messages"] as? [String: Any],
              let arr = messages["global"] as? [[String: Any]] else { return [] }
        return arr.map(message(from:))
    }
}
