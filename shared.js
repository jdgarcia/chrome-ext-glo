const API_BASE = 'https://app.gitkraken.com/api';
const EndPoints = {
  USER: `${API_BASE}/glo/users/validate`,
  NOTIFICATIONS: `${API_BASE}/notifications/notifications`
};

function login(accessToken) {
  return setupRequest(EndPoints.USER)
    .post({ auth_token: accessToken })
    .then((user) => {
      const data = {
        accessToken,
        email: user.email
      };

      return new Promise((resolve) => {
        chrome.storage.local.set(data, resolve);
      });
    })
    .catch((e) => {
      return logout()
        .then(() => {
          throw e;
        });
    });
}

function logout() {
  return new Promise((resolve) => {
    chrome.storage.local.clear(() => {
      chrome.browserAction.setBadgeText({ text: '!' });
      resolve();
    });
  });
}

function getUnseenNotifications() {
  return setupRequest(EndPoints.NOTIFICATIONS)
    .get()
    .then((notifications) => {
      const unseenNotifications = notifications.filter((notification) => !notification.seen_date);
      chrome.browserAction.setBadgeText({ text: unseenNotifications.length > 99 ? '99+' : String(unseenNotifications.length) });
      return unseenNotifications;
    });
}

function setupRequest(url) {
  return {
    get: () => sendRequest('GET', url),
    post: (data) => sendRequest('POST', url, data)
  }
}

function sendRequest(method, url, data = {}) {
  return new Promise((resolve, reject) => {
    chrome.storage.local.get('accessToken', ({ accessToken }) => {
      const request = new XMLHttpRequest();

      request.addEventListener('load', (event) => {
        const response = JSON.parse(event.target.response);
        if (event.target.status === 200) {
          resolve(response);
        } else {
          reject(response);
        }
      });

      request.open(method, url);
      request.setRequestHeader('authorization', accessToken);

      if (method === 'POST') {
        request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
        request.send(JSON.stringify(data));
      } else {
        request.send();
      }
    });
  });
}
