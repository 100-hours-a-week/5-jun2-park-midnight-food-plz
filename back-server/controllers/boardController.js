const boardRepository = require('../models/boardRepository');
const userRepository = require('../models/userRepository');

/* 1) 공통 로직 */

// 응답 메시지 
const getResponseMessage = (message, data) => {
    const response = {
        message, 
        data
    };
    return response;
}

// 인자값 유효성 검사
const validateRequest = (req) => {
    for (const key in req) {
        if (req.hasOwnProperty(key)) {
            if (req[key] === null || req[key] === undefined) {
                throw new Error('invalid_request');
            }
        }
    }
}

// 생성 날짜
const getNowDate = () => {
    const createdAt = new Date();

    const year = createdAt.getFullYear();
    const month = ('0' + (createdAt.getMonth() + 1)).slice(-2);
    const day = ('0' + createdAt.getDate()).slice(-2);

    const dateString = year + '-' + month  + '-' + day;

    const hours = ('0' + createdAt.getHours()).slice(-2); 
    const minutes = ('0' + createdAt.getMinutes()).slice(-2);
    const seconds = ('0' + createdAt.getSeconds()).slice(-2); 

    const timeString = hours + ':' + minutes  + ':' + seconds;

    return dateString + ' ' + timeString;
}

/* 2) 게시판 로직 */

// 게시글 등록
exports.registerBoardWithImage = (req, res, next) => {
    try {
        if (!req.session.user) {
            throw new Error('unauthorized user');
        }

        const title = req.body.title;
        const content = req.body.content;
        const created_at = getNowDate();
        const updated_at = getNowDate();
        const image_url = req.file.path;
        const writer_id = req.session.user.id;
        const writer = userRepository.findById(writer_id);

        const board = { writer, title, content, image_url, created_at, updated_at };

        validateRequest(board);

        const findBoard = boardRepository.save(board);
        const response = getResponseMessage('register_success', findBoard);

        console.log(response);
        
        return res.status(201).json(response);
    } catch (error) {

    }
}

// 게시글 목록 조회
exports.findAllBoards = async (req, res, next) => {
    try {
        const boards = boardRepository.findAll();
        const response = getResponseMessage('success', boards);

        return res.status(200).json(response);
    } catch (error) {
        return res.status(500).json({ 'message': error.message });
    }
}

// 게시글 상세 조회
exports.findByBoardId = async (req, res, next) => {
    try { 
        const boardId = req.params.boardId;

        const findBoard = boardRepository.findById(boardId);

        const response = getResponseMessage('success', findBoard);
        return res.status(200).json(response);
    } catch (error) {
        if (error.message == 'invalid_request') {
            return res.status(400).json({ 'message': error.message });
        }
        if (error.message == 'board_not_exist') {
            return res.status(404).json({ 'message': error.message });
        }
        return res.status(500).json({ 'message': error.message });
    }
}

// 게시글 수정
const validateBoardWriter = (user, board_id) => {
    const findBoard = boardRepository.findById(board_id);
    console.log(`userid: ${user.id}, boardWriterId: ${findBoard.writer_id}`);
    if (user.id != findBoard.writer_id) {
        throw new Error('권한이 없는 사용자입니다.');
    }
}

exports.updateBoard = async (req, res, next) => {
    try {
        if (!req.session.user) {
            throw new Error('unauthorized user');
        }
        
        const board_id = req.params.boardId;
        validateBoardWriter(req.session.user, board_id);

        const { title, content } = req.body;
        const image_url = req.file.path;
        const newBoardData = { board_id, title, content, image_url };

        const updatedBoard = boardRepository.updateBoard(newBoardData);
        const response = getResponseMessage('update_success', updatedBoard);

        return res.status(200).json(response);

    } catch (error) {
        // 유효하지 않은 요청인 경우 : 400
        // 인증되지 않은 사용자 요청인 경우 : 401
        // 권한이 없는 사용자 요청인 경우 : 403

        if (error.message == 'board_not_exist') {
            return res.status(404).json({ 'message': error.message });
        }
        return res.status(500).json({ 'message': error.message });
    }
    
}

// 게시글 삭제
exports.deleteBoard = async (req, res, next) => {
    try {
        if (!req.session.user) {
            throw new Error('unauthorized user');
        }
        
        const board_id = req.params.boardId;
        validateBoardWriter(req.session.user, board_id);

        boardRepository.deleteById(board_id);

        return res.status(200).json({ 'message': 'delete_success' });

    } catch (error) {
        // 유효하지 않은 요청인 경우 : 400
        // 인증되지 않은 사용자 요청인 경우 : 401
        // 권한이 없는 사용자 요청인 경우 : 403

        if (error.message == 'board_not_exist') {
            return res.status(404).json({ 'message': error.message });
        }
        return res.status(500).json({ 'message': error.message });
    }
}

// 3) 댓글 로직
// 댓글 등록
exports.registerComment = async (req, res, next) => {
    try {
        if (!req.session.user) {
            throw new Error('unauthorized user');
        }

        const board_id = req.params.boardId;
        const comment = req.body.comment;
        const created_at = getNowDate();
        const writer_id = req.session.user.id;
        const writer = userRepository.findById(writer_id);

        const commentData = boardRepository.saveComment(writer, board_id, comment, created_at);
        const response = getResponseMessage('register_success', commentData);

        return res.status(201).json(response);

    } catch (error) {
        // 유효하지 않은 요청인 경우 : 400
        // 인증되지 않은 사용자 요청인 경우 : 401
        // 권한이 없는 사용자 요청인 경우 : 403

        if (error.message == 'board_not_exist') {
            return res.status(404).json({ 'message': error.message });
        }
        return res.status(500).json({ 'message': error.message });
    }
}

// 댓글 수정
const validateCommentWriter = (user, board_id, comment_id) => {
    const findComment = boardRepository.findCommentById(board_id, comment_id);
    
    if (user.id != findComment.comment_writer_id) {
        throw new Error('권한이 없는 사용자입니다.');
    }
}

exports.updateComment = async (req, res, next) => {
    try {
        if (!req.session.user) {
            throw new Error('unauthorized user');
        }

        const board_id = req.params.boardId;
        const comment_id = req.params.commentId;

        validateCommentWriter(req.session.user, board_id, comment_id);

        const comment = req.body.comment;
        const updated_at = getNowDate();

        const commentData = boardRepository.updateComment(board_id, comment_id, comment, updated_at);
        const response = getResponseMessage('update_success', commentData);

        return res.status(200).json(response);

    } catch (error) {
        // 유효하지 않은 요청인 경우 : 400
        // 인증되지 않은 사용자 요청인 경우 : 401
        // 권한이 없는 사용자 요청인 경우 : 403

        if (error.message == 'board_not_exist') {
            return res.status(404).json({ 'message': error.message });
        }
        return res.status(500).json({ 'message': error.message });
    }
}

// 댓글 삭제
exports.deleteComment = async (req, res, next) => {
    try {
        if (!req.session.user) {
            throw new Error('unauthorized user');
        }

        const board_id = req.params.boardId;
        const comment_id = req.params.commentId;

        validateCommentWriter(req.session.user, board_id, comment_id);

        boardRepository.deleteCommentById(board_id, comment_id);

        return res.status(200).json({ 'message': 'delete_success' });
    } catch (error) {
        // 유효하지 않은 요청인 경우 : 400
        // 인증되지 않은 사용자 요청인 경우 : 401
        // 권한이 없는 사용자 요청인 경우 : 403

        if (error.message == 'board_not_exist') {
            return res.status(404).json({ 'message': error.message });
        }
        return res.status(500).json({ 'message': error.message });
    }
}
