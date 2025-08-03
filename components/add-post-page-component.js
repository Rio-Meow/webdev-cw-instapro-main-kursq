import { renderHeaderComponent } from "./header-component.js";
import { renderUploadImageComponent } from "./upload-image-component.js";
import { addPost } from "../api.js"; 
import { goToPage, getToken } from "../index.js"; 
import { POSTS_PAGE } from "../routes.js"; 

export function renderAddPostPageComponent({ appEl, onAddPostClick }) {

  let postImageUrl = ""; 

  const render = () => {
    const appHtml = `
    <div class="page-container">
      <div class="header-container"></div>
      <div class="form">
        <h3 class="form-title">Добавить пост</h3>
        <div class="form-inputs">
          <div id="upload-image-container"></div>
          <textarea id="description-textarea" class="input textarea" placeholder="Описание картинки"></textarea>
          <div class="form-error" id="add-post-error"></div>
          <button class="button" id="add-post-button">Добавить</button>
        </div>
      </div>
    </div>
    `;

    appEl.innerHTML = appHtml;


    renderHeaderComponent({
      element: document.querySelector(".header-container"),
    });

    const uploadImageContainer = document.getElementById("upload-image-container");
    renderUploadImageComponent({
      element: uploadImageContainer,
      onImageUrlChange(newImageUrl) {
        postImageUrl = newImageUrl; 
        console.log("--- Лог из add-post-page-component.js ---");
        console.log("полученный URL изображения:", newImageUrl); 
        const errorEl = document.getElementById("add-post-error");
        if (!newImageUrl && errorEl.textContent.includes("изображение")) {
            errorEl.textContent = "";
        }
      },
    });

    const addButton = document.getElementById("add-post-button");
    const descriptionTextarea = document.getElementById("description-textarea");
    const errorEl = document.getElementById("add-post-error");

    addButton.addEventListener("click", () => {
      errorEl.textContent = "";

      const description = descriptionTextarea.value.trim(); 
      const token = getToken(); 

      console.log("--- Лог из add-post-page-component.js ---");
      console.log("Описание поста (после trim):", description);
      console.log("URL изображения:", postImageUrl);
      console.log("Токен:", token);
      console.log("Тип URL изображения:", typeof postImageUrl); 
      console.log("Длина URL изображения:", postImageUrl.length);

      if (!description) {
        errorEl.textContent = "Введите описание";
        return;
      }

      if (!postImageUrl) {
        errorEl.textContent = "Загрузите изображение";
        return;
      }

      addPost({
        description,
        imageUrl: postImageUrl,
        token: token,
      })
        .then((response) => {
          console.log("Пост успешно добавлен:", response);
          if (onAddPostClick) {
            onAddPostClick({ description, imageUrl: postImageUrl });
          }
          goToPage(POSTS_PAGE);
        })
        .catch((error) => {
          console.error("Ошибка при добавлении поста:", error);
          errorEl.textContent = error.message || "Не удалось добавить пост. Попробуйте позже.";
        });
    });
  };

  render();
}