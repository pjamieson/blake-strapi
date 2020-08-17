module.exports = ({ env }) => ({
  email: {
    provider: 'amazon-ses',
    providerOptions: {
      key: env('AWS_ACCESS_KEY_ID'),
      secret: env('AWS_ACCESS_SECRET'),
      amazon: 'https://email.us-east-2.amazonaws.com',
    },
    settings: {
      defaultFrom: 'patrick@iartx.com',
      defaultReplyTo: 'patrick@iartx.com',
    },
  },
});
