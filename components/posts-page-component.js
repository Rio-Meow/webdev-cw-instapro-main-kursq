import { renderHeaderComponent } from "./header-component.js";
import { goToPage, getToken, user } from "../index.js";
import { POSTS_PAGE, USER_POSTS_PAGE } from "../routes.js";
import { likePost, dislikePost, getPosts } from "../api.js";

function escapeHtml(string) {
    if (!string) return '';
    return string.replace(/[&<>"']/g, function(m) {
        switch (m) {
            case '&': return '&amp;';
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '"': return '&quot;';
            case "'": return '&#039;';
            default: return m;
        }
    });
}

function getLikedPostsFromLocalStorage() {
    try {
        const likedPosts = localStorage.getItem('likedPosts');
        return likedPosts ? JSON.parse(likedPosts) : [];
    } catch (error) {
        console.error("Error getting liked posts from localStorage:", error);
        return [];
    }
}

function saveLikedPostsToLocalStorage(likedPosts) {
    try {
        localStorage.setItem('likedPosts', JSON.stringify(likedPosts));
    } catch (error) {
        console.error("Error saving liked posts to localStorage:", error);
    }
}

export function renderPostsPageComponent({ appEl }) {
    console.log("--- ENTERING renderPostsPageComponent ---");

    const currentUser = user;
    const currentUserStringId = user ? String(user.id) : null;
    console.log("renderPostsPageComponent: current user ID:", currentUserStringId);

    let postsData = [];
    let likedPosts = getLikedPostsFromLocalStorage();

    const setLikedPosts = (newLikedPosts) => {
        likedPosts = newLikedPosts;
        saveLikedPostsToLocalStorage(likedPosts);
    };

    const renderPost = (post) => {
        // **Ключевое изменение:** обращаемся к post.user.imageUrl напрямую
        const finalAvatarUrl = post.user.imageUrl;
        console.log(`Post Avatar URL for post ${post.id}:`, finalAvatarUrl);

        const isLiked = currentUser && likedPosts.includes(post.id);

        return `
            <li class="post" id="post-${post.id}">
                <div class="post-header" data-user-id="${post.user.id}">
                    <img src="${post.user.imageUrl}" alt="Аватар пользователя" class="post-header__user-image">
                    <p class="post-header__user-name">${escapeHtml(post.user.name)}</p>
                </div>
                <div class="post-image-container">
                    <img class="post-image" src="${post.imageUrl}" alt="Изображение поста">
                </div>
                <div class="post-likes">
                    <button data-post-id="${post.id}" class="like-button" ${!currentUser ? 'disabled' : ''}>
                        ${isLiked ?
                            `<svg width="24" height="24" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.79 12 5.05C13.09 3.79 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z"/>
                            </svg>` :
                            `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.79 12 5.05C13.09 3.79 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                            </svg>`}
                    </button>
                    <p class="post-likes-text" id="post-likes-text-${post.id}">
                        Нравится: <strong>${post.likes ? post.likes.length : 0}</strong>
                    </p>
                </div>
                <p class="post-text">
                    <span class="user-name">${escapeHtml(post.user.name)}</span>
                    ${escapeHtml(post.description)}
                </p>
                <p class="post-date">
                    ${new Date(post.createdAt).toLocaleString()}
                </p>
            </li>
        `;
    };

    const render = () => {
        const appHtml = `
            <div class="page-container">
                <div class="header-container"></div>
                <ul class="posts">
                    ${postsData.map(renderPost).join('')}
                </ul>
            </div>`;

        appEl.innerHTML = appHtml;

        renderHeaderComponent({
            element: document.querySelector(".header-container"),
        });

        document.querySelectorAll(".post-header").forEach(userEl => {
            userEl.addEventListener("click", () => {
                const userId = userEl.dataset.userId;
                if (userId) {
                    console.log("Переход на профиль пользователя с ID:", userId);
                    goToPage(USER_POSTS_PAGE, { userId: userId });
                }
            });
        });

        document.querySelectorAll(".like-button").forEach(likeButton => {
            if (!currentUser) {
                likeButton.setAttribute('disabled', true);
            } else {
                likeButton.removeAttribute('disabled');
            }

            likeButton.addEventListener("click", () => {
                const postId = likeButton.dataset.postId;
                const postIndex = postsData.findIndex(post => post.id === postId);
                const likesTextElement = document.getElementById(`post-likes-text-${postId}`);
                const likeButtonElement = likeButton;

                if (!currentUserStringId) {
                    alert("Пожалуйста, авторизуйтесь, чтобы ставить лайки.");
                    return;
                }

                if (postIndex === -1) {
                    console.error("Пост с ID", postId, "не найден в postsData");
                    return;
                }

                const isLiked = likedPosts.includes(postId);

                if (isLiked) {
                    dislikePost({ postId, token: getToken() })
                        .then(() => {
                            setLikedPosts(likedPosts.filter(id => id !== postId));
                            if (postsData[postIndex]) {
                                if (postsData[postIndex].likes && postsData[postIndex].likes.length > 0) {
                                    postsData[postIndex].likes = postsData[postIndex].likes.filter(like => like && like.user && like.user.id !== currentUserStringId);
                                }
                            }
                            if (likesTextElement) {
                                likesTextElement.innerHTML = `Нравится: <strong>${postsData[postIndex].likes ? postsData[postIndex].likes.length : 0}</strong>`;
                            }
                            likeButtonElement.innerHTML = `
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.79 12 5.05C13.09 3.79 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
                                </svg>`;
                        })
                        .catch((error) => {
                            console.error("Error disliking post:", error);
                            alert("Не удалось снять лайк. Попробуйте снова.");
                        });
                } else {
                    likePost({ postId, token: getToken() })
                        .then(() => {
                            setLikedPosts([...likedPosts, postId]);
                            if (postsData[postIndex]) {
                                if (!postsData[postIndex].likes) {
                                postsData[postIndex].likes = [];
                                }
                                postsData[postIndex].likes.push({ user: { id: currentUserStringId } });
                            }
                            if (likesTextElement) {
                                likesTextElement.innerHTML = `Нравится: <strong>${postsData[postIndex].likes ? postsData[postIndex].likes.length : 0}</strong>`;
                            }
                            if (likeButtonElement) {
                                likeButtonElement.innerHTML = `
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.79 12 5.05C13.09 3.79 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z"/>
                                    </svg>`;
                            }
                        })
                        .catch((error) => {
                            console.error("Error liking post:", error);
                            alert("Не удалось поставить лайк. Попробуйте снова.");
                        });
                }
            });
        });
    };

    getPosts({ token: getToken() })
        .then((loadedPosts) => {
            console.log("--- SUCCESS: Loaded posts in posts-page-component ---");
            postsData = loadedPosts;
            render();
        })
        .catch((error) => {
            console.error("--- ERROR: Failed to load posts in posts-page-component ---", error);
            appEl.innerHTML = `
                <div class="page-container">
                    <div class="header-container"></div>
                    <div class="error-message">
                        Не удалось загрузить посты. Попробуйте позже. <br>
                        Ошибка: ${escapeHtml(error.message)}
                    </div>
                </div>`;
            renderHeaderComponent({
                element: document.querySelector(".header-container"),
            });
        });
};