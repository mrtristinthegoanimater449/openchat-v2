import SwiftUI

@main
struct OpenChatApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .task { await Api.refreshServerURL() }
        }
    }
}
