const dataURL = '../resource/data/boards-data.json';
const boardURL = '../resource/data/board-data.json';

const boardModal = document.getElementById('delete-board-modal');
const replyModal = document.getElementById('delete-reply-modal');

const boardModalCancelButton = document.getElementById('board-cancel-btn');
const boardModalConfirmButton = document.getElementById('board-delete-btn');

const replyModalCancelButton = document.getElementById('reply-cancel-btn');
const replyModalConfirmButton = document.getElementById('reply-delete-btn');

const replyTextArea = document.getElementById('reply');
const replySubmitButton = document.getElementById('reply-submit-btn');
const replyUpdateButton = document.getElementById('reply-update-btn');
const replyDeleteButton = document.getElementById('reply-delete-btn');

const userProfile = document.getElementById('user-profile-img');
const currentUserProfile = document.getElementById('current-profile');
const loginButton = document.getElementById('login-btn')
const logoutButton = document.getElementById('logout-btn');


const COMMON_URL = 'http://localhost:8080';

const getPathVariable = (dataType) => {
    const path = window.location.pathname;
    const paths = path.split('/');

    if (dataType === 'board') {
        return paths[2];
    }
    if (dataType === 'comment') {
        return paths[4];
    }
}

const findBoardData = (boards, pathVariable) => {
    return boards.find(board => board.board_id == pathVariable);
}

const formatNumber = (inputNumber) => {
    if (inputNumber >= 1000) {
        inputNumber = (inputNumber / 1000).toFixed(1) + 'k';
    }
    return inputNumber;
}

const formatDate = (inputDate) => {
    const date = new Date(inputDate);
    const year = date.getFullYear(); 
    const month = ('0' + (date.getMonth() + 1)).slice(-2); 
    const day = ('0' + date.getDate()).slice(-2); 
    const hours = ('0' + date.getHours()).slice(-2); 
    const minutes = ('0' + date.getMinutes()).slice(-2); 
    const seconds = ('0' + date.getSeconds()).slice(-2); 

    return `${year}:${month}:${day} ${hours}:${minutes}:${seconds}`;
}

// 로그인한 유저 정보 가져오기
const getCurrentUserInfo = async () => {
    const option = {
        credentials: 'include',
        method: 'GET',
        headers: {
            'Content-Type' : 'application/json'
        }
    }

    const res = await fetch(`${COMMON_URL}/users/me`, {
        ...option
    });

    return res;
}

// 페이지 로드시 로그인한 유저 프로필 가져오기
const getCurrentUserProfile = async () => {

    const res = await getCurrentUserInfo();

    if (res.status == 200) {
        const json = await res.json();
        const user = json.user;

        const profileUrl = user.profile_url;
        currentUserProfile.src = `${COMMON_URL}/${profileUrl}`;
        userProfile.classList.remove('hidden');
        loginButton.classList.add('hidden');
    } else if (res.status == 204) {
        loginButton.classList.remove('hidden');
        userProfile.classList.add('hidden');
    } else {
        //alert(res.message);
    }
} 

//window.addEventListener('DOMContentLoaded', getCurrentUserProfile);
getCurrentUserProfile();

// 게시글 정보
const generateInfoBox = (element) => {
    let createdAt = formatDate(element.created_at);
    let writerProfileURL = `${COMMON_URL}/${element.writer_profile_url}`;

    return `
        <div id="post-title">
            <h2>${element.title}</h2>
        </div>
        <div id="post-info-view">
            <div id="post-info">
                <div class="writer-info">
                    <img class="profile-img" src=${writerProfileURL}>
                    <span id="writer">${element.writer_name}</span>
                </div>
                <span class="time">${createdAt}</span>
            </div>
            <div class="btns">
                <button type="button" onclick='location.href="/boards/${element.board_id}/edit"'>수정</button>
                <button type="button" onclick='showBoardDeleteModal()'>삭제</button>
            </div>
        </div>
    `;
}

// 게시글 컨텐츠
const generateContentView = (element) => {
    let fileName = element.image_url.split('/')[1];
    let contentImgURL = `${COMMON_URL}/images/${fileName}`;
    let content = element.content;
    let viewsCount = formatNumber(element.views_count);
    let commentsCount = formatNumber(element.comments_count);


    return `
        <div id="content-img">
            <img src=${contentImgURL}>
        </div>
        <div id="content-text">
            <textarea name="" id="" cols="30" rows="10" readonly>${content}</textarea>
        </div>
        <div id="content-info-box">
            <div class="content-info">
                <p>${viewsCount}</p>
                <p>조회수</p>
            </div>
            <div class="content-info">
                <p>${commentsCount}</p>
                <p>댓글</p>
            </div>
        </div>
    `;
}

// 댓글 
const generateReplyForm = (data, currentUser) => {
    let commentId = data.comment_id;
    let writerProfileURL = `${COMMON_URL}/${data.comment_writer_profile}`;
    let writerName = data.comment_writer_name;
    let comment = data.comment_content;
    let createdAt = formatDate(data.created_at);

    // 로그인하지 않았거나 댓글 작성자가 아닌 경우 수정/삭제 버튼 안보임
    if (currentUser == undefined || data.comment_writer_id != currentUser.user_id) {
        return `
        <div id="${commentId}" class="reply-form">
            <div class="reply-info">
                <div class="reply-header">
                    <div class="writer-info">
                        <img class="profile-img" src=${writerProfileURL}>
                        <span class="reply-writer">${writerName}</span>
                    </div>
                    <span class="time">${createdAt}</span>
                </div>
                <div class="reply-content">
                    <span>${comment}</span>
                </div>
            </div>
        </div>
    `;
    } else if (data.comment_writer_id == currentUser.user_id) {
        return `
        <div id="${commentId}" class="reply-form">
            <div class="reply-info">
                <div class="reply-header">
                    <div class="writer-info">
                        <img class="profile-img" src=${writerProfileURL}>
                        <span class="reply-writer">${writerName}</span>
                    </div>
                    <span class="time">${createdAt}</span>
                </div>
                <div class="reply-content">
                    <span>${comment}</span>
                </div>
            </div>
            <div class="btns">
                <button type="button" onclick='submitUpdateReply(this)' class="reply-modify-btn">수정</button>
                <button type="button" onclick='showReplyDeleteModal(this)'><a>삭제</a></button>
            </div>
        </div>
        `;
    }
}

const generateReplies = (comments, user) => {
    let html = '';
    comments.forEach(comment => {
        html += generateReplyForm(comment, user);
    });
    return html;
}

// 게시글 내용 가져와서 생성
const generateBoardContents = async () => {
    const boardId = getPathVariable('board');
    try {
        const option = {
            credentials: 'include',
            method: 'GET',
            headers: {
                'Content-Type' : 'application/json'
            }
        }
        
        const response = await fetch(`${COMMON_URL}/boards/${boardId}`, {
            ...option
        });
        const json = await response.json();
        const board = json.data;

        const userResponse = await getCurrentUserInfo();
        let userJson;
        let currentUser;
        if (userResponse.status == 200) {
            userJson = await userResponse.json();
            currentUser = userJson.user;
        } 
        console.log(currentUser);

        let infoBox = generateInfoBox(board);
        let contentView = generateContentView(board);
        let replies = generateReplies(board.comments, currentUser);

        document.getElementById('post-info-box').innerHTML = infoBox;
        document.getElementById('content-view').innerHTML = contentView;
        document.getElementById('reply-list').innerHTML = replies;

    } catch (error) {
        console.error('template error!', error);
        throw error;
    }
}

generateBoardContents();

const findContentArea = (id) => {
    const children = document.getElementById('reply-list').querySelectorAll('.reply-form');

    for (let i = 0; i < children.length; i++) {
        // 현재 자식 요소가 해당 요소와 같으면 인덱스를 저장하고 반복 종료
        if (children[i].id === id) {
            return children[i];
        }
    }
}

// 게시글 삭제
const showBoardDeleteModal = (element) => {
    boardModal.classList.remove('hidden');
    boardModal.classList.add('visible');
}

const deleteBoard = async (event) => {
    event.preventDefault();
    const boardId = getPathVariable('board');

    const option = {
        credentials: 'include',
        method: 'DELETE',
        headers: {
            'Content-Type' : 'application/json'
        }
    }

    const res = await fetch(`${COMMON_URL}/boards/${boardId}`, {
        ...option
    });

    const json = await res.json();
    if (res.status == 200 || res.status == 201) {
        setTimeout(() => {
            location.replace('/boards');
        }, 500);
    } else {
        boardModal.classList.remove('visible');
        boardModal.classList.add('hidden');
        alert(json.message);
    }
}

/*
* 댓글 관련 로직
*/


// 댓글 등록
const submitReply = async (event) => {
    event.preventDefault();
    const boardId = getPathVariable('board');

    const replyData = {
        'comment': replyTextArea.value
    }

    const option = {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        },
        body: JSON.stringify(replyData)
    }

    const res = await fetch(`${COMMON_URL}/boards/${boardId}/comments`, {
        ...option
    });

    const json = await res.json();
    if (res.status == 200 || res.status == 201) {
        location.reload();
    } else {
        alert(json.message);
    }
}

// 댓글 수정
const submitUpdateReply = async (element) => {
    const replyFormElement = element.parentNode.parentNode;
    const replyContentElement = findContentArea(replyFormElement.id); 

    const replyContentArea = replyContentElement.querySelector('.reply-info .reply-content span');
    const content = replyContentArea.textContent;
    replyTextArea.value = content;

    replySubmitButton.style.display = 'none';
    replyUpdateButton.style.display = '';

    const boardId = getPathVariable('board');
    const commentId = replyFormElement.id;

    replyUpdateButton.addEventListener('click', async () => {
        const replyData = {
            'comment': replyTextArea.value
        }

        const option = {
            credentials: 'include',
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify(replyData)
        }

        const res = await fetch(`${COMMON_URL}/boards/${boardId}/comments/${commentId}`, {
            ...option
        });

        const json = await res.json();

        if (res.status == 200 || res.status == 201) {
            replySubmitButton.style.display = '';
            replyUpdateButton.style.display = 'none';
            location.reload();
        } else {
            alert(json.message);
            location.reload();
        }
    });
}

// 댓글 삭제
const elements = [];
const showReplyDeleteModal = (element) => {
    replyModal.classList.remove('hidden');
    replyModal.classList.add('visible');
    window.scrollTo(0, 0, 'smooth');

    if (elements.isEmpty) {
        elements.push(element);
    } else {
        elements.pop();
        elements.push(element);
    }

    replyDeleteButton.addEventListener('click', deleteReply);
}

const deleteReply = async (event) => {
    event.preventDefault();
    const element = elements[0];
    const replyFormElement = element.parentNode.parentNode;
    const boardId = getPathVariable('board');
    const commentId = replyFormElement.id;

    replyModal.classList.remove('visible');
    replyModal.classList.add('hidden');

    const option = {
        credentials: 'include',
        method: 'DELETE',
        headers: {
            'Content-Type' : 'application/json'
        }
    }

    const res = await fetch(`${COMMON_URL}/boards/${boardId}/comments/${commentId}`, {
        ...option
    });

    const json = await res.json();

    if (res.status == 200 || res.status == 201) {
        location.reload();
    } else {
        boardModal.classList.remove('visible');
        boardModal.classList.add('hidden');
        alert(json.message);
        location.reload();
    }
}

const activeSubmitButton = () => {
    const isEmpty = (replyTextArea.value.length == 0);
    if (isEmpty) {
        replySubmitButton.disabled = true;
        replySubmitButton.style.backgroundColor = "#ACA0EB";
        replySubmitButton.style.cursor = "default";
    } else {
        replySubmitButton.disabled = false;
        replySubmitButton.style.backgroundColor = "#7F6AEE";
        replySubmitButton.style.cursor = "pointer";
    }
}

const activeUpdateButton = () => {
    const isEmpty = (replyTextArea.value.length == 0);
    if (isEmpty) {
        replyUpdateButton.disabled = true;
        replyUpdateButton.style.backgroundColor = "#ACA0EB";
        replyUpdateButton.style.cursor = "default";
    } else {
        replyUpdateButton.disabled = false;
        replyUpdateButton.style.backgroundColor = "#7F6AEE";
        replyUpdateButton.style.cursor = "pointer";
    }
}

replyTextArea.addEventListener('keyup', () => {
    activeSubmitButton(),
    activeUpdateButton()
});

boardModalCancelButton.addEventListener('click', () => {
    boardModal.classList.remove('visible');
    boardModal.classList.add('hidden');
})
boardModalConfirmButton.addEventListener('click', deleteBoard);

replyModalCancelButton.addEventListener('click', () => {
    replyModal.classList.remove('visible');
    replyModal.classList.add('hidden');
})

replySubmitButton.addEventListener('click', submitReply);

// 로그아웃
const requestLogout = async (event) => {
    event.preventDefault();
    const option = {
        credentials: 'include',
        method: 'POST',
        headers: {
            'Content-Type' : 'application/json'
        }
    }

    const res = await fetch(`${COMMON_URL}/users/logout`, {
        ...option
    });

    const json = await res.json();

    if (res.status == 200 || res.status == 201) {
        alert('로그아웃 성공!');
        setTimeout(() => {
            location.replace('/boards');
        }, 1000); 
    } else {
        alert(json.message);
    }
}

logoutButton.addEventListener('click', requestLogout);


