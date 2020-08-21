module.exports = {
  settings: {
    cors: {
      enabled: true,
      origin: [
        'http://localhost:8000',
        'https://blake.art',
        'https://www.blake.art'
      ],
      expose: [
        'WWW-Authenticate',
        'Server-Authorization',
        'Access-Control-Expose-Headers'
      ],
      maxAge: 31536000,
      credentials: true,
      methods: [
        'GET',
        'POST',
        'PUT',
        'PATCH',
        'DELETE',
        'OPTIONS',
        'HEAD'
      ],
      headers: [
        'Content-Type',
        'Authorization',
        'X-Frame-Options',
        'Origin',
        'Access-Control-Allow-Headers'
      ]
    },
  },
};
