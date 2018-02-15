chrome.storage.local.get('accessToken', ({ accessToken }) => {
  if (accessToken) {
    login(accessToken)
      .then(setupNotificationPolling);
  } else {
    logout();
  }
});

function setupNotificationPolling() {
  console.log('setting up polling...');
  const interval = setInterval(() => {
    console.log('polling...');
    getUnseenNotifications()
      .catch(() => {
        console.log('polling stopped');
        clearInterval(interval);
      });
  }, 1000 * 60 * 5);

  getUnseenNotifications();
}
