const baseUrl = process.env.TEST_BASE_URL ?? "http://localhost:3000";
const username = process.env.TEST_AUTH_USERNAME;
const password = process.env.TEST_AUTH_PASSWORD;

if (!username || !password) {
  console.error(
    "Defina TEST_AUTH_USERNAME e TEST_AUTH_PASSWORD antes de executar o teste."
  );
  process.exit(1);
}

const cookieJar = new Map();

function storeCookies(response) {
  for (const cookie of response.headers.getSetCookie()) {
    const [nameValue] = cookie.split(";", 1);
    const separator = nameValue.indexOf("=");
    cookieJar.set(
      nameValue.slice(0, separator),
      nameValue.slice(separator + 1)
    );
  }
}

function cookieHeader() {
  return [...cookieJar]
    .map(([name, value]) => `${name}=${value}`)
    .join("; ");
}

async function request(path, init = {}) {
  const headers = new Headers(init.headers);
  if (cookieJar.size) headers.set("Cookie", cookieHeader());

  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers,
    redirect: "manual",
  });
  storeCookies(response);
  return response;
}

async function run() {
  const csrfResponse = await request("/api/auth/csrf");
  if (!csrfResponse.ok) {
    throw new Error(`Falha ao obter CSRF (${csrfResponse.status}).`);
  }
  const { csrfToken } = await csrfResponse.json();

  const loginResponse = await request("/api/auth/callback/credentials", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "X-Auth-Return-Redirect": "1",
    },
    body: new URLSearchParams({
      username,
      password,
      csrfToken,
      callbackUrl: baseUrl,
    }),
  });

  const loginResult = await loginResponse.json();
  if (!loginResponse.ok || new URL(loginResult.url).searchParams.has("error")) {
    throw new Error(`Login recusado (${loginResponse.status}).`);
  }

  const optionsResponse = await request(
    "/api/auth/webauthn-options/passkey?action=register"
  );
  const responseText = await optionsResponse.text();

  if (!optionsResponse.ok) {
    throw new Error(
      `Falha ao gerar opções WebAuthn (${optionsResponse.status}): ${responseText}`
    );
  }

  const result = JSON.parse(responseText);
  if (result.action !== "register" || !result.options?.challenge) {
    throw new Error("O servidor retornou opções WebAuthn inválidas.");
  }

  console.log(
    `WebAuthn pronto: action=${result.action}, rpId=${result.options.rp?.id}`
  );
}

run().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
