const personalKey = "prod";
const baseHost = "https://webdev-hw-api.vercel.app";
const postsHost = `${baseHost}/api/v1/${personalKey}/instapro`;
const defaultAvatarUrl = "https://storage.yandexcloud.net/skypro-webdev-homework-bucket/1680591910917-%25C3%2590%25C2%25A1%25C3%2590%25C2%25BD%25C3%2590%25C2%25B8%25C3%2590%25C2%25BC%25C3%2590%25C2%25BE%25C3%2590%25C2%25BA%2520%25C3%2591%25C2%258D%25C3%2590%25C2%25BA%25C3%2591%25C2%2580%25C3%2590%25C2%25B0%25C3%2590%25C2%25BD%25C3%2590%25C2%25B0%25202023-04-04%2520%25C3%2590%25C2%25B2%252014.04.40.png";

export function getPosts({ token }) {
  return fetch(postsHost, {
    method: "GET",
    headers: {
      Authorization: token,
    },
  })
    .then((response) => {
      if (!response.ok) {
        return response.text().then(text => {
          let errorDetail = text;
          const contentType = response.headers.get("content-type");
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorJson = JSON.parse(text);
              if (errorJson.error) errorDetail = errorJson.error;
            } catch (e) { /* Не удалось распарсить как JSON */ }
          }
          throw new Error(`Сервер вернул ошибку ${response.status}: ${errorDetail}`);
        });
      }

      if (response.status === 401) {
        throw new Error("Нет авторизации");
      }
      
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Сервер вернул некорректный ответ (не JSON): ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      if (data && Array.isArray(data.posts)) {
        console.log("--- API getPosts Response ---");
        console.log("Raw data:", JSON.stringify(data, null, 2));

        return data.posts.map(post => ({
            ...post,
            user: post.user && typeof post.user.id !== 'undefined' ? {
                ...post.user,
                id: String(post.user.id),
                imageUrl: post.user.imageUrl || defaultAvatarUrl, 
            } : { id: 'unknown', name: 'Unknown User', imageUrl: defaultAvatarUrl },
            likes: Array.isArray(post.likes) ? post.likes.map(like => ({
                ...like,
                user: like.user && typeof like.user.id !== 'undefined' ? {
                    ...like.user,
                    id: String(like.user.id),
                    imageUrl: like.user.imageUrl || defaultAvatarUrl,
                } : { id: 'unknown', name: 'Unknown User', imageUrl: defaultAvatarUrl }
            })) : []
        }));
      } else {
        throw new Error("Неверный формат данных от API: отсутствуют посты или они не в формате массива");
      }
    })
    .catch((error) => {
      console.error("Ошибка при получении постов:", error);
      throw error;
    });
}

export function uploadImage({ file }) {
  const data = new FormData();
  data.append("file", file);

  return fetch(baseHost + "/api/upload/image", {
    method: "POST",
    body: data,
  }).then((response) => {
    if (!response.ok) {
      return response.text().then(text => {
          throw new Error(`Ошибка загрузки файла: ${response.status} - ${text}`);
      });
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Сервер вернул некорректный ответ (не JSON): ${response.status}`);
    }
    return response.json();
  });
}

export function addPost({ description, imageUrl, token }) {
  console.log('Отправляю данные для addPost:', { description, imageUrl, token });

  return fetch(postsHost, {
    method: "POST",
    headers: {
      Authorization: token,
    },
    body: JSON.stringify({
      description,
      imageUrl,
    }),
  })
    .then((response) => {
      const contentType = response.headers.get("content-type");
      if (!response.ok) {
        return response.text().then(text => {
          let errorData = { error: "Не удалось получить детали ошибки от сервера." };
          if (contentType && contentType.includes("application/json")) {
            try {
              errorData = JSON.parse(text);
            } catch (e) { /* Ошибка не JSON */ }
          } else {
              errorData.error = text;
          }
          throw new Error(`Сервер вернул ошибку ${response.status}: ${errorData.error || response.statusText}`);
        });
      }

      if (!contentType || !contentType.includes("application/json")) {
          throw new Error(`Сервер вернул некорректный ответ (не JSON): ${response.status}`);
      }
      return response.json();
    });
}

export function registerUser({ login, password, name, imageUrl }) {
  return fetch(baseHost + "/api/user", {
    method: "POST",
    body: JSON.stringify({ 
      login,
      password,
      name,
      imageUrl,
    }),
  }).then((response) => {
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      return response.text().then(text => {
          let errorMsg = "Произошла ошибка при регистрации";
          if (contentType && contentType.includes("application/json")) {
              try {
                  const errorData = JSON.parse(text);
                  if (errorData.error) errorMsg = errorData.error;
              } catch (e) { errorMsg = text; } 
          } else { errorMsg = text; } 
          throw new Error(errorMsg);
      });
    }
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Сервер вернул некорректный ответ (не JSON): ${response.status}`);
    }
    return response.json();
  });
}

export function loginUser({ login, password }) {
  return fetch(baseHost + "/api/user/login", {
    method: "POST",
    body: JSON.stringify({ 
      login,
      password,
    }),
  }).then((response) => {
    const contentType = response.headers.get("content-type");
    if (!response.ok) {
      return response.text().then(text => {
          let errorMsg = "Неверный логин или пароль";
          if (contentType && contentType.includes("application/json")) {
              try {
                  const errorData = JSON.parse(text);
                  if (errorData.error) errorMsg = errorData.error;
              } catch (e) { errorMsg = text; } 
          } else { errorMsg = text; } 
          throw new Error(errorMsg);
      });
    }
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Сервер вернул некорректный ответ (не JSON): ${response.status}`);
    }
    return response.json();
  });
}

export function likePost({ postId, token }) {
  return fetch(`${postsHost}/${postId}/like`, {
    method: "POST",
    headers: {
      Authorization: token,
    },
  }).then((response) => {
    if (!response.ok) {
      return response.text().then(text => {
          throw new Error(`Ошибка при лайке: ${response.status} - ${text}`);
      });
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Сервер вернул некорректный ответ (не JSON): ${response.status}`);
    }
    return response.json();
  });
}

export function dislikePost({ postId, token }) {
  return fetch(`${postsHost}/${postId}/dislike`, {
    method: "POST",
    headers: {
      Authorization: token,
    },
  }).then((response) => {
    if (!response.ok) {
      return response.text().then(text => {
          throw new Error(`Ошибка при дизлайке: ${response.status} - ${text}`);
      });
    }
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
        throw new Error(`Сервер вернул некорректный ответ (не JSON): ${response.status}`);
    }
    return response.json();
  });
}

export function saveUserToLocalStorage(user) {
  window.localStorage.setItem("user", JSON.stringify(user));
}

export function getUserFromLocalStorage() {
  try {
    const userData = window.localStorage.getItem("user");
    if (!userData) return null;
    const parsedUser = JSON.parse(userData);
    if (parsedUser && parsedUser.user && typeof parsedUser.user.id !== 'undefined') {
        parsedUser.user.id = String(parsedUser.user.id);
    }
    return parsedUser;
  } catch (error) {
    console.error("Ошибка при получении пользователя из localStorage:", error);
    return null;
  }
}

export function removeUserFromLocalStorage() {
  window.localStorage.removeItem("user");
}