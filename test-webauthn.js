const http = require('http');

async function run() {
  // First, we need to authenticate and get a session cookie
  // Since we are doing this programmatically, we'll hit the credentials login endpoint
  
  const loginData = new URLSearchParams({
    username: "gab",
    password: "g@b081204",
    redirect: "false"
  });

  console.log("Logging in...");
  const loginRes = await fetch("http://localhost:3000/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded"
    },
    body: loginData.toString()
  });

  const cookies = loginRes.headers.get("set-cookie");
  if (!cookies) {
    console.error("Failed to get cookies. Res:", await loginRes.text());
    return;
  }
  
  // Extract authjs.session-token
  const sessionCookie = cookies.split(',').find(c => c.includes('authjs.session-token'));
  console.log("Got session cookie:", sessionCookie ? "YES" : "NO");

  // Now request webauthn options
  console.log("Fetching webauthn options...");
  const optionsRes = await fetch("http://localhost:3000/api/auth/webauthn-options/passkey?action=register", {
    method: "GET",
    headers: {
      "Cookie": sessionCookie || cookies
    }
  });

  const status = optionsRes.status;
  const text = await optionsRes.text();
  console.log("Status:", status);
  console.log("Response starts with:", text.substring(0, 100));
  
  if (status !== 200 || !text.startsWith("{")) {
    console.error("FAILED to get valid JSON options");
    console.error(text);
  } else {
    console.log("SUCCESS! Got JSON options");
  }
}

run().catch(console.error);
