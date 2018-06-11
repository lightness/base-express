module.exports = {
    development: {
        username: 'postgres',
        password: 'root',
        database: 'base_express',
        host: '127.0.0.1',
        dialect: 'postgres',
    },
    test: {
        dialect: 'sqlite',
        storage: ':memory:',
    },
    production: {
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        host: process.env.DB_HOSTNAME,
        dialect: 'mysql',
    },
};
