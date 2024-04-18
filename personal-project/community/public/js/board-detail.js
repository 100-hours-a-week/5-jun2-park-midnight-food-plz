const dataURL = '../resource/data/boards-data.json';
const boardURL = '../resource/data/board-data.json';

const replyTextArea = document.getElementById('reply');
const replySubmitButton = document.getElementById('reply-submit-btn');

const getPathVariable = () => {
    const path = window.location.pathname;
    const boardIds = path.split('/');
    return boardIds[2];
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

const generateInfoBox = (element) => {
    let createdAt = formatDate(element.created_at);

    return `
        <div id="post-title">
            <h2>${element.title}</h2>
        </div>
        <div id="post-info-view">
            <div id="post-info">
                <div class="writer-info">
                    <img class="profile-img" src=${element.writer_profile_url}>
                    <span id="writer">${element.writer_name}</span>
                </div>
                <span class="time">${createdAt}</span>
            </div>
            <div class="btns">
                <button type="button" onclick='location.href="/boards/${element.board_id}/edit"'>수정</button>
                <button type="button" onclick='location.href="#delete-board-modal"'">삭제</button>
            </div>
        </div>
    `;
}

const generateContentView = (element) => {
    let contentImgURL = element.image_url;
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

const generateReplyForm = (data) => {
    let commentId = data.comment_id;
    let writerProfileURL = data.comment_writer_profile;
    let writerName = data.comment_writer_name;
    let comment = data.comment_content;
    let createdAt = formatDate(data.created_at);

    return `
        <div id="comment-${commentId}" class="reply-form">
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
                <button type="button" onclick='updateReply(this)' class="reply-modify-btn">수정</button>
                <button type="button" onclick='location.href="#delete-reply-modal"'"><a>삭제</a></button>
            </div>
        </div>
    `;
}

const generateReplies = (comments) => {
    let html = '';
    comments.forEach(comment => {
        html += generateReplyForm(comment);
    });
    return html;
}

const generateBoardContents = async () => {
    try {
        const response = await fetch(boardURL);
        const json = await response.json();
        const boards = json.boards;

        const pathVariable = getPathVariable();
        const data = findBoardData(boards, pathVariable);

        console.log(data);

        let infoBox = generateInfoBox(data);
        let contentView = generateContentView(data);
        let replies = generateReplies(data.comments);

        document.getElementById('post-info-box').innerHTML = infoBox;
        document.getElementById('content-view').innerHTML = contentView;
        document.getElementById('reply-list').innerHTML = replies;

    } catch (error) {
        console.error('template error!', error);
        throw error;
    }
}

generateBoardContents();

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


replyTextArea.addEventListener('keyup', activeSubmitButton);

const findContentArea = (id) => {
    const children = document.getElementById('reply-list').querySelectorAll('.reply-form');

    for (let i = 0; i < children.length; i++) {
        // 현재 자식 요소가 해당 요소와 같으면 인덱스를 저장하고 반복 종료
        if (children[i].id === id) {
            return children[i];
        }
    }
}

// 나중에 수정해야함
const updateReply = (element) => {
    const replyFormElement = element.parentNode.parentNode;
    const replyContentElement = findContentArea(replyFormElement.id); 
    console.log(replyContentElement);

    const replyContentArea = replyContentElement.querySelector('.reply-info .reply-content span');
    const content = replyContentArea.textContent;
    replyTextArea.value = content;
    replySubmitButton.textContent = '댓글 수정';

    replySubmitButton.addEventListener('click', () => {
        replySubmitButton.textContent = '댓글 작성';
        const updateContent = replyTextArea.value;
        replyContentArea.textContent = updateContent;
        replyTextArea.textContent = "";
    })
}
