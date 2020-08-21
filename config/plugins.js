module.exports = ({ env }) => ({
  email: {
    provider: 'gmail-2lo',
    providerOptions: {
      username: 'blake@blake.art',
      clientId: env('GSUITE_EMAIL_CLIENT_ID'),
      privateKey: env('GSUITE_EMAIL_PRIVATE_KEY').replace(/\\n/g, '\n'),
    },
    settings: {
      defaultFrom: 'blake@blake.art',
      defaultReplyTo: 'blake@blake.art',
    },
  },
});
