chrome.storage.local.get('accessToken', ({ accessToken }) => {
  if (accessToken) {
    login(accessToken)
      .then(getUnseenNotifications);
  } else {
    logout();
  }
});
