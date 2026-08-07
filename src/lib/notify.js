/**
 * Local notifications.
 *
 * This is deliberately *not* Firebase Cloud Messaging. FCM needs a service
 * worker, a VAPID key pair and a server to send from; the Notification API
 * needs none of that and covers the actual use case here, because both phones
 * keep a Firestore listener open — the moment a score is saved the other
 * device already has the document, so it only has to surface it.
 *
 * iOS caveat: web notifications require iOS/iPadOS 16.4+ AND the app to have
 * been added to the home screen. In Safari tabs the request silently no-ops,
 * which is why nothing here throws on failure.
 */

export function notificationsSupported() {
  return typeof window !== 'undefined' && 'Notification' in window
}

export function notificationPermission() {
  if (!notificationsSupported()) return 'unsupported'
  return Notification.permission
}

export async function requestNotifications() {
  if (!notificationsSupported()) return 'unsupported'
  try {
    return await Notification.requestPermission()
  } catch {
    return 'denied'
  }
}

/** Fire-and-forget; never throws, never blocks the UI. */
export function notify(title, { body, tag, silent = false } = {}) {
  if (!notificationsSupported() || Notification.permission !== 'granted') return
  // Showing a notification while the user is looking at the page is noise.
  if (document.visibilityState === 'visible') return
  try {
    const n = new Notification(title, { body, tag, silent, icon: '/apple-touch-icon.png' })
    n.onclick = () => {
      window.focus()
      n.close()
    }
  } catch {
    /* Some browsers require a service worker registration — ignore. */
  }
}
