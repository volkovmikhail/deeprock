require('dotenv').config();

const config = {
  httpPort: process.env.HTTP_PORT ?? 3000,
  dbUser: process.env.DB_USERNAME,
  dbPassword: process.env.DB_PASSWORD,
  dbName: process.env.DB_NAME,
  dbHostname: process.env.DB_HOST,
  dbPort: process.env.DB_PORT,
  dbConnectionLimit: process.env.DB_CONNECTION_LIMIT,
  dbQueueLimit: process.env.DB_QUEUE_LIMIT ?? 0,
  domain: process.env.DOMAIN,
  sessionSecret: process.env.SESSION_SECRET,
  basePath: process.env.BASE_PATH ?? '',
  nodeEnv: process.env.NODE_ENV ?? 'development',
  tgToken: process.env.TG_BOT_TOKEN,
  baseUrl: process.env.BASE_URL,
  useMockUser: process.env.USE_MOCK_USER === 'true',
  mockUser: JSON.parse(process.env.MOCK_USER ?? {}),
};

function checkConfig(config) {
  const errors = [];
  Object.keys(config).forEach((key) => {
    if (config[key] === undefined) {
      errors.push(`- ${key} is undefined`);
    }
  });

  if (errors.length > 0) {
    errors.push('!!! Check Environment variables !!!');

    throw new Error(errors.join('\n'));
  }
}

checkConfig(config);

module.exports = config;
