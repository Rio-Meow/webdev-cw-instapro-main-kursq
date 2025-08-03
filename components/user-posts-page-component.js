import { renderHeaderComponent } from "./header-component.js";
import { goToPage, getToken, user } from "../index.js";
import { USER_POSTS_PAGE } from "../routes.js";
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

export function renderUserPostsPageComponent({ appEl, userId }) {
    console.log("--- renderUserPostsPageComponent ---", { appEl, userId });

    const currentUser = user;
    const currentUserStringId = user ? String(user.id) : null;
    console.log("renderUserPostsPageComponent: current user ID:", currentUserStringId);

    let postsData = [];
    let likedPosts = getLikedPostsFromLocalStorage();

    const setLikedPosts = (newLikedPosts) => {
        likedPosts = newLikedPosts;
        saveLikedPostsToLocalStorage(likedPosts);
    };

    const renderLikeButtonIcon = (postId) => {
        const post = postsData.find(p => p.id === postId);
        if (!post) return '';

        const isLiked = currentUser && likedPosts.includes(post.id);

        return isLiked ?
            `<svg width="24" height="24" viewBox="0 0 24 24" fill="red" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.79 12 5.05C13.09 3.79 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z"/>
            </svg>` :
            `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 21.35L10.55 20.03C5.4 15.36 2 12.28 2 8.5C2 5.42 4.42 3 7.5 3C9.24 3 10.91 3.79 12 5.05C13.09 3.79 14.76 3 16.5 3C19.58 3 22 5.42 22 8.5C22 12.28 18.6 15.36 13.45 20.03L12 21.35Z" stroke="black" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>`;
    };

    const renderPage = () => {
        let userProfileHTML = '';
        const targetUser = postsData.find(post => post.user && post.user.id === userId)?.user;

        if (targetUser) {
            userProfileHTML = `
                <div class="user-profile">
                    <img src="${targetUser.imageUrl}" alt="Аватар пользователя" class="user-avatar">
                    <h2 class="user-name">Страница пользователя: ${escapeHtml(targetUser.name)}</h2>
                </div>
            `;
        } else {
            userProfileHTML = `
                <div class="user-profile">
                    <h2>Информация о пользователе с ID ${userId} не найдена или у него нет постов.</h2>
                </div>
            `;
        }

        const userPosts = postsData.filter(post => post.user && post.user.id === userId);
        const postsHtml = userPosts.map(renderPost).join('');

        const appHtml = `
            <div class="page-container">
                <div class="header-container"></div>
                ${userProfileHTML}
                <ul class="posts">
                    ${postsHtml}
                </ul>
            </div>`;

        appEl.innerHTML = appHtml;

        renderHeaderComponent({
            element: document.querySelector(".header-container"),
        });

        document.querySelectorAll(".like-button").forEach(likeButton => {
            if (!currentUser) {
                likeButton.setAttribute('disabled', true);
            } else {
                likeButton.removeAttribute('disabled');
            }

            likeButton.addEventListener("click", () => {
                const postId = likeButton.dataset.postId;
                const postIndexInAllPosts = postsData.findIndex(post => post.id === postId);
                const likesTextElement = document.getElementById(`post-likes-text-${postId}`);
                const likeButtonElement = likeButton;

                if (!currentUserStringId) {
                    alert("Пожалуйста, авторизуйтесь, чтобы ставить лайки.");
                    return;
                }

                if (postIndexInAllPosts === -1) {
                    console.error("Пост с ID", postId, "не найден в postsData");
                    return;
                }

                const isLiked = likedPosts.includes(postId);

                if (isLiked) {
                    dislikePost({ postId, token: getToken() })
                        .then(() => {
                            setLikedPosts(likedPosts.filter(id => id !== postId));
                            if (postsData[postIndexInAllPosts]) {
                                if (postsData[postIndexInAllPosts].likes && postsData[postIndexInAllPosts].likes.length > 0) {
                                    postsData[postIndexInAllPosts].likes = postsData[postIndexInAllPosts].likes.filter(like => like && like.user && like.user.id !== currentUserStringId);
                                }
                            }
                            if (likesTextElement) {
                                likesTextElement.innerHTML = `Нравится: <strong>${postsData[postIndexInAllPosts].likes ? postsData[postIndexInAllPosts].likes.length : 0}</strong>`;
                            }
                            likeButtonElement.innerHTML = renderLikeButtonIcon(postId);
                        })
                        .catch((error) => {
                            console.error("Ошибка при дизлайке:", error);
                            alert("Не удалось снять лайк. Попробуйте снова.");
                        });
                } else {
                    likePost({ postId, token: getToken() })
                        .then(() => {
                            setLikedPosts([...likedPosts, postId]);
                            if (postsData[postIndexInAllPosts]) {
                                if (!postsData[postIndexInAllPosts].likes) {
                                    postsData[postIndexInAllPosts].likes = [];
                                }
                                postsData[postIndexInAllPosts].likes.push({ user: { id: currentUserStringId } });
                            }
                            if (likesTextElement) {
                                likesTextElement.innerHTML = `Нравится: <strong>${postsData[postIndexInAllPosts].likes ? postsData[postIndexInAllPosts].likes.length : 0}</strong>`;
                            }
                            likeButtonElement.innerHTML = renderLikeButtonIcon(postId);
                        })
                        .catch((error) => {
                            console.error("Ошибка при лайке:", error);
                            alert("Не удалось поставить лайк. Попробуйте снова.");
                        });
                }
            });
        });
    };

    const renderPost = (post) => {
        console.log(`Post Avatar URL for post ${post.id}:`, post.user.imageUrl);

        const isLiked = currentUser && likedPosts.includes(post.id);

        return `
            <li class="post" id="post-${post.id}">
                <div class="post-header" data-user-id="${post.user.id}">
                    <img src="${post.user.imageUrl}" alt="Аватар пользователя" class="post-header__user-image">
                    <span class="post-user-name">${escapeHtml(post.user.name)}</span>
                </div>
                <div class="post-image-container">
                    <img class="post-image" src="${post.imageUrl}" alt="Изображение поста">
                </div>
                <div class="post-likes">
                    <button data-post-id="${post.id}" class="like-button" ${!currentUser ? 'disabled' : ''}>
                        ${renderLikeButtonIcon(post.id)}
                    </button>
                    <p class="post-likes-text" id="post-likes-text-${post.id}">
                        Нравится: <strong>${post.likes ? post.likes.length : 0}</strong>
                    </p>
                </div>
                <p class="post-text">
                    <span class="post-user-name">${escapeHtml(post.user.name)}</span>
                    ${escapeHtml(post.description)}
                </p>
            </li>
        `;
    };

    getPosts({ token: getToken() })
        .then((loadedPosts) => {
            console.log("--- SUCCESS: Loaded posts in user-posts-page-component ---");
            postsData = loadedPosts.filter(post => post.user && post.user.id === userId);
            renderPage();
        })
        .catch((error) => {
            console.error("--- ERROR: Failed to load posts in user-posts-page-component ---", error);
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