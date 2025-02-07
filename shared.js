const AUTH_API_BASE = 'https://api.gitkraken.com';
const GLO_API_BASE = 'https://app.gitkraken.com/api';

const EndPoints = {
  AUTH: `${AUTH_API_BASE}/oauth/token`,
  USER: `${GLO_API_BASE}/glo/users/validate`,
  NOTIFICATIONS: `${GLO_API_BASE}/notifications/notifications`
};

function login(email, password) {
  email = encodeURIComponent(email);
  password = encodeURIComponent(password);

  return setupRequest(EndPoints.AUTH)
    .post(`grant_type=password&client_id=CLIENT_ID&client_secret=CLIENT_SECRET&username=${email}&password=${password}`)
    .then(({ access_token }) => validateToken(access_token));
}

function validateToken(accessToken) {
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
        .then(() => Promise.reject(e));
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
      let badgeText;
      if (unseenNotifications.length === 0) {
        badgeText = '';
      } else if (unseenNotifications.length < 100) {
        badgeText = String(unseenNotifications.length);
      } else {
        badgeText = '99+';
      }

      chrome.browserAction.setBadgeText({ text: badgeText });
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
        if (url.startsWith(EndPoints.AUTH)) {
          request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
          request.send(data);
        } else {
          request.setRequestHeader('Content-Type', 'application/json;charset=UTF-8');
          request.send(JSON.stringify(data));
        }
      } else {
        request.send();
      }
    });
  });
}
