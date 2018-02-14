chrome.storage.local.get('accessToken', ({ accessToken }) => {
  if (accessToken) {
    login(accessToken);
  } else {
    buildLoginForm();
  }
});


/* popup content functions */

function buildLoginForm() {
  const div = document.createElement('div');
  div.textContent = 'Access Token:';

  const input = document.createElement('input');
  const button = document.createElement('button');
  button.textContent = 'Login';
  button.addEventListener('click', () => {
    login(input.value);
  });

  document.body.innerHTML = '';
  document.body.appendChild(div);
  document.body.appendChild(input);
  document.body.appendChild(button);
}

function buildMainContent() {
  chrome.storage.local.get('email', ({ email }) => {
    const div = document.createElement('div');
    div.textContent = email;

    const button = document.createElement('button');
    button.textContent = 'Logout';
    button.addEventListener('click', logout);

    const notificationsDiv = document.createElement('div');
    notificationsDiv.style.maxHeight = '200px';

    document.body.innerHTML = '';
    document.body.appendChild(div);
    document.body.appendChild(button);
    document.body.appendChild(notificationsDiv);

    setupRequest('https://app.gitkraken.com/api/notifications/notifications')
      .get()
      .then((notifications) => {
        const newNotifications = notifications.filter(notification => !notification.seen_date);
        chrome.browserAction.setBadgeText({ text: newNotifications.length > 99 ? '99+' : String(newNotifications.length) });

        newNotifications.slice(0, 20).forEach((notification) => {
          const { event, data } = notification;
          const notificationDiv = document.createElement('div');
          notificationDiv.style.padding = '5px';
          notificationDiv.style.borderTop = '1px solid #ddd';

          switch(event) {
            case 'card-added':
              notificationDiv.textContent = `${data.user.name} created card "${data.card.name}"`;
              break;
            case 'card-member-added':
              notificationDiv.textContent = `${data.user.name} assigned ${data.members[0].name} to card "${data.card.name}"`;
              break;
            case 'card-moved-column':
              notificationDiv.textContent = `${data.user.name} moved card "${data.card.name}" to column "${data.column.name}"`;
              break;
            case 'card-updated-description':
              notificationDiv.textContent = `${data.user.name} updated descripton on card "${data.card.name}"`;
              break;
            default:
              notificationDiv.textContent = event;
              notificationDiv.style.color = 'red';
              break;
          }

          notificationsDiv.appendChild(notificationDiv);
        });
      });
  });
}

function login(accessToken) {
  setupRequest('https://app.gitkraken.com/api/glo/users/validate')
    .post({ auth_token: accessToken })
    .then((user) => {
      const data = {
        accessToken,
        email: user.email
      };
      chrome.storage.local.set(data, buildMainContent);
    })
    .catch(logout);
}

function logout() {
  chrome.storage.local.remove('accessToken', buildLoginForm);
}


/* request helpers */

function setupRequest(url) {
  return {
    get: () => sendRequest('GET', url),
    post: (data) => sendRequest('POST', url, data)
  }
}

function sendRequest(method = 'GET', url = '', data = {}) {
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
