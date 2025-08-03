import { getPosts } from "./api.js";
import { renderAddPostPageComponent } from "./components/add-post-page-component.js";
import { renderAuthPageComponent } from "./components/auth-page-component.js";
import {
  ADD_POSTS_PAGE,
  AUTH_PAGE,
  LOADING_PAGE,
  POSTS_PAGE,
  USER_POSTS_PAGE,
} from "./routes.js";
import { renderPostsPageComponent } from "./components/posts-page-component.js";
import { renderLoadingPageComponent } from "./components/loading-page-component.js";
import { renderUserPostsPageComponent } from "./components/user-posts-page-component.js";
import {
  getUserFromLocalStorage,
  removeUserFromLocalStorage,
  saveUserToLocalStorage,
} from "./api.js";

export let user = getUserFromLocalStorage();

console.log("--- index.js initial user state ---");
console.log("Initial user object:", user);
console.log("Initial user ID (string):", user ? String(user.id) : 'undefined');
console.log("------------------------------------");

export let page = null;
export let posts = [];

export const getToken = () => {
  const token = user ? `Bearer ${user.token}` : undefined;
  return token;
};

export const logout = () => {
  user = null;
  removeUserFromLocalStorage();
  goToPage(POSTS_PAGE);
};

export const goToPage = (newPage, data) => {
  if (
    ![
      POSTS_PAGE,
      AUTH_PAGE,
      ADD_POSTS_PAGE,
      USER_POSTS_PAGE,
      LOADING_PAGE,
    ].includes(newPage)
  ) {
    throw new Error(`Страницы "${newPage}" не существует.`);
  }

  if (newPage === ADD_POSTS_PAGE) {
    page = user ? ADD_POSTS_PAGE : AUTH_PAGE;
    return renderApp();
  }

  if (newPage === POSTS_PAGE) {
    page = LOADING_PAGE;
    renderApp();

    return getPosts({ token: getToken() })
      .then((newPosts) => {
        console.log("Загруженные посты (index.js):", newPosts);
        page = POSTS_PAGE;
        posts = newPosts;
        renderApp();
      })
      .catch((error) => {
        console.error("Ошибка при загрузке постов (index.js):", error);
        page = POSTS_PAGE;
        renderApp();
      });
  }

  if (newPage === USER_POSTS_PAGE) {
    console.log("Открываю страницу пользователя: ", data.userId);
    page = USER_POSTS_PAGE;
    return renderApp(data);
  }

  page = newPage;
  renderApp();
};

const renderApp = (data) => {
  const appEl = document.getElementById("app");
  if (!appEl) {
    console.error("Элемент '#app' не найден!");
    return;
  }

  console.log(`renderApp called. Current page: ${page}. User object:`, user);

  if (page === LOADING_PAGE) {
    return renderLoadingPageComponent({
      appEl,
      user,
      goToPage,
    });
  }

  if (page === AUTH_PAGE) {
    return renderAuthPageComponent({
      appEl,
      setUser: (newUser) => {
        user = newUser;
        saveUserToLocalStorage(user);
        goToPage(POSTS_PAGE);
      },
    });
  }

  if (page === ADD_POSTS_PAGE) {
    return renderAddPostPageComponent({
      appEl,
    });
  }

  if (page === POSTS_PAGE) {
    return renderPostsPageComponent({
      appEl,
    });
  }

  if (page === USER_POSTS_PAGE) {
    return renderUserPostsPageComponent({
      appEl,
      userId: data.userId,
    });
  }
};

console.log("--- App Initialization ---");
console.log("index.js initial state: user object before goToPage:", user);
goToPage(POSTS_PAGE);