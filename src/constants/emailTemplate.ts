export const getOtpEmailTemplate = (otp: string, name?: string): string => {
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            background: #fff;
            margin: 0;
            padding: 60px 20px;
          }
          .container { 
            max-width: 460px; 
            margin: 0 auto;
          }
          h1 {
            font-size: 21px;
            font-weight: 600;
            color: #000;
            margin: 0 0 8px 0;
            letter-spacing: -0.4px;
          }
          p {
            color: #666;
            font-size: 15px;
            line-height: 1.5;
            margin: 0 0 24px 0;
          }
          .code {
            background: #f5f5f5;
            border: 1px solid #3ECF8E;
            border-radius: 6px;
            padding: 24px;
            text-align: center;
            margin: 24px 0;
          }
          .code-text {
            font-size: 28px;
            font-weight: 600;
            letter-spacing: 6px;
            color: #000;
            font-family: monospace;
          }
          .small {
            color: #3ECF8E;
            font-size: 13px;
            margin-top: 12px;
            font-weight: 500;
          }
          .divider {
            border-top: 1px solid #f0f0f0;
            margin: 32px 0 24px 0;
          }
          .muted {
            color: #999;
            font-size: 13px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>Verify your email</h1>
          ${name ? `<p>Hi ${name},</p>` : ''}
          <p>Enter this code to continue:</p>
          
          <div class="code">
            <div class="code-text">${otp}</div>
            <div class="small">Expires in 10 minutes</div>
          </div>

        </div>
      </body>
    </html>
  `;
};
