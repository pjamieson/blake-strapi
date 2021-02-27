module.exports = ({ env }) => ({
  email: {
    provider: 'gmail-2lo',
    providerOptions: {
      username: 'blake@blake.art',
      clientId: env('GSUITE_EMAIL_CLIENT_ID'),
      privateKey: `${env('GSUITE_EMAIL_PK1')}${env('GSUITE_EMAIL_PK2')}${env('GSUITE_EMAIL_PK3')}`.replace(/\\n/g, '\n'),
    },
    settings: {
      defaultFrom: 'contact@blake.art',
      defaultReplyTo: 'contact@blake.art',
    },
  },
  upload: {
    provider: 'aws-s3',
    providerOptions: {
      accessKeyId: env('AWS_ACCESS_KEY_ID'),
      secretAccessKey: env('AWS_ACCESS_SECRET'),
      region: env('AWS_REGION'),
      params: {
        Bucket: env('AWS_BUCKET'),
      },
    },
  },
});
