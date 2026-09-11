// Convert VAPID key from base64 to Uint8Array
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Check if push notifications are supported
export function isPushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window;
}

// Subscribe to push notifications
export async function subscribeToPush() {
  try {
    // Check support
    if (!isPushSupported()) {
      console.log('Push notifications not supported');
      return { success: false, error: 'Not supported' };
    }

    // Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return { success: false, error: 'Permission denied' };
    }

    // Get service worker registration
    const registration = await navigator.serviceWorker.ready;

    // Get VAPID public key from server
    const response = await fetch('/api/push/vapid-public-key');
    const data = await response.json();
    
    if (!data.publicKey) {
      console.log('No VAPID public key');
      return { success: false, error: 'No public key' };
    }

    // Subscribe
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(data.publicKey)
    });

    // Send subscription to server
    const saveResponse = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ subscription })
    });

    if (!saveResponse.ok) {
      throw new Error('Failed to save subscription');
    }

    console.log('✅ Subscribed to push notifications');
    return { success: true, subscription };
  } catch (error) {
    console.error('Error subscribing to push:', error);
    return { success: false, error: error.message };
  }
}

// Check if already subscribed
export async function isSubscribed() {
  try {
    if (!isPushSupported()) return false;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    return subscription !== null;
  } catch (error) {
    console.error('Error checking subscription:', error);
    return false;
  }
}

// Unsubscribe
export async function unsubscribeFromPush() {
  try {
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();
    
    if (subscription) {
      await subscription.unsubscribe();
      console.log('✅ Unsubscribed from push notifications');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error unsubscribing:', error);
    return { success: false, error: error.message };
  }
}