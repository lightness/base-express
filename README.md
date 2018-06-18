# How to run/test me

## Pre-requirements
```
git clone https://github.com/lightness/base-express
cd base-express
npm i
```

## Run
```
npm start
```

## Test
```
npm test
```

# Notes

1. For realtime messaging I used long polling. I didn't use web sockets here to reduce complexity. More info: https://www.npmjs.com/package/express-longpoll
2. Since user can be offline, on trying to establish long poll connection we need to send unread messages.
3. I implement feature to mark message as read to be sure that user got message. So until message marked as read, long poll will return message again and again. Be careful of UI part :)

# Benefits of using typescript
 - types and syntactic sugar
 - more convenient imoprts
 - no need to add `use strict` manually. Typescript did it under the hood.

# Other improvements
 - use https://www.npmjs.com/package/dotenv (can help to organize your config on different envs)
 - use https://www.npmjs.com/package/socket.io instead of long polling
 - use https://www.npmjs.com/package/winston (can help to manage logs in real projects)
