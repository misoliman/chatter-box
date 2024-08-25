const createMessage = (body, userName) => {
    const message = {
        body,
        createdAt: new Date().getTime(),
        owner: userName
    }
    return message;
};

module.exports = { createMessage }