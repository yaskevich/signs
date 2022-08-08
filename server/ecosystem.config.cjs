module.exports = {
  apps: [
    {
      name: 'signs',
      script: './index.js',
      watch: false,
      instance_var: 'INSTANCE_ID',
      env: {
        NODE_ENV: 'production'
      }
    }
  ]
};
