/**
 * PM2 Ecosystem — Ofertafy
 *
 * Uso:
 *   pm2 start ecosystem.config.cjs        (iniciar)
 *   pm2 reload ecosystem.config.cjs       (reiniciar após deploy)
 *   pm2 stop ofertafy                     (parar)
 *
 * O cron de busca de ofertas roda via instrumentation.ts
 * a cada 60 minutos automaticamente.
 */

module.exports = {
  apps: [
    {
      name: 'ofertafy',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: __dirname,
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      // Reinicia automaticamente se crashar
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      // Logs
      log_date_format: 'DD/MM/YYYY HH:mm:ss',
      error_file: 'logs/error.log',
      out_file: 'logs/out.log',
      merge_logs: true,
      // Delay entre restarts
      restart_delay: 5000,
      max_restarts: 10,
    },
  ],
}
