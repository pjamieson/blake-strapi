module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  admin: {
    autoOpen: true,
  },
});
