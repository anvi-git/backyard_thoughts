async function loadPosts(postsFile, key, todayContainerId, previousContainerId, allPostsContainerId) {
  const response = await fetch(postsFile);
  const postsHtml = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(postsHtml, 'text/html');
  const posts = Array.from(doc.querySelectorAll(`.post[data-key="${key}"]`));
  const today = new Date().toISOString().split('T')[0];

  const todayContainer = document.getElementById(todayContainerId);
  const previousContainer = document.getElementById(previousContainerId);
  const allPostsContainer = document.getElementById(allPostsContainerId);

  // Sort posts by date (newest first)
  posts.sort((a, b) => new Date(b.getAttribute('data-date')) - new Date(a.getAttribute('data-date')));

  posts.forEach(post => {
    const postDate = post.getAttribute('data-date');
    const postElement = document.createElement('div');
    postElement.innerHTML = post.innerHTML;

    if (postDate === today && todayContainer) {
      todayContainer.appendChild(postElement);
    } else if (postDate !== today && previousContainer) {
      postElement.innerHTML += `<span class="post-date">${postDate}</span>`;
      previousContainer.appendChild(postElement);
    }

    if (allPostsContainer) {
      postElement.innerHTML += `<span class="post-date">${postDate}</span>`;
      allPostsContainer.appendChild(postElement);
    }
  });
}

async function loadPostContent() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = urlParams.get('post');
  if (postId) {
    const currentPage = window.location.pathname.split('/').pop();
    let postsFile;
    postsFile = 'posts.html';
    const response = await fetch(postsFile);
    const data = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(data, 'text/html');
    const post = doc.getElementById(postId);
    if (post) {
      document.getElementById('post-container').innerHTML = post.outerHTML;
    } else {
      document.getElementById('post-container').innerHTML = '<p>Post not found.</p>';
    }
  } else {
    document.getElementById('post-container').innerHTML = post.outerHTML;
  }
}

async function loadPostBackgrounds() {
  const currentPage = window.location.pathname.split('/').pop();
  let postsFile;
  postsFile = 'posts.html';
  const response = await fetch(postsFile);
  const data = await response.text();
  const parser = new DOMParser();
  const doc = parser.parseFromString(data, 'text/html');
  const postLinks = document.querySelectorAll('.post-link');

  console.log(`Found ${postLinks.length} post links`);

  postLinks.forEach(link => {
    const postId = link.getAttribute('data-post-id');
    const post = doc.getElementById(postId);
    if (post) {
      const background = post.getAttribute('data-background');
      if (background) {
        console.log(`Applying background image for post ID: ${postId}`);
        link.style.backgroundImage = `url(${background})`;
      } else {
        console.log(`No background image found for post ID: ${postId}`);
      }
    } else {
      console.log(`No post found for post ID: ${postId}`);
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const currentPage = window.location.pathname.split('/').pop();
  loadPosts('posts.html', 'post', 'today-posts', 'previous-posts');
  loadPostContent();
  loadPostBackgrounds();
});