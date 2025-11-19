module.exports = {
  apps: [
    {
      name: "izing-backend",
      script: "./backend/dist/server.js",
      cwd: "/home/deploy/izing.open.io",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "dev",
        PORT: 3000
      },
      error_file: "./logs/backend-error.log",
      out_file: "./logs/backend-out.log",
      log_file: "./logs/backend-combined.log",
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "1G",
      merge_logs: true,
      kill_timeout: 5000
    },
    {
      name: "izing-frontend",
      script: "./frontend/server.js",
      cwd: "/home/deploy/izing.open.io",
      instances: 1,
      exec_mode: "fork",
      env: {
        NODE_ENV: "production",
        PORT: 4444
      },
      error_file: "./logs/frontend-error.log",
      out_file: "./logs/frontend-out.log",
      log_file: "./logs/frontend-combined.log",
      time: true,
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      merge_logs: true
    }
  ]
};

