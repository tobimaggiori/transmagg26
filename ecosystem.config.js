module.exports = {
  apps: [
    {
      name: "transmagg",
      script: "npm",
      args: "start",
      cwd: "/home/tobi/transmagg26",
      env: {
        NODE_ENV: "production",
        PORT: 3000,
      },
    },
  ],
}
