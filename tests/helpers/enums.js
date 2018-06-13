const ContentType = Object.freeze({
    HTML: /text\/html/,
    JSON: /application\/json/,
});

const Accept = Object.freeze({
    JSON: 'application/json',
});

const Header = Object.freeze({
    ACCEPT: 'Accept',
    AUTHORIZATION: 'Authorization',
    CONTENT_TYPE: 'Content-Type',
});

module.exports = {
    ContentType: ContentType,
    Accept: Accept,
    Header: Header,
};
