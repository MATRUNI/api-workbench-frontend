export const LANGUAGES = [
  {
    id: 'javascript',
    name: 'JavaScript',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/javascript/javascript-original.svg',
    clients: [
      { id: 'fetch', name: 'Fetch' },
      { id: 'axios', name: 'Axios' },
      { id: 'xhr', name: 'XMLHttpRequest (AJAX)' },
    ],
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/typescript/typescript-original.svg',
    clients: [
      { id: 'fetch', name: 'Fetch' },
      { id: 'axios', name: 'Axios' },
    ],
  },
  {
    id: 'python',
    name: 'Python',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/python/python-original.svg',
    clients: [
      { id: 'requests', name: 'Requests' },
      { id: 'httpx', name: 'HTTPX' },
      { id: 'aiohttp', name: 'aiohttp' },
      { id: 'urllib', name: 'urllib' },
    ],
  },
  {
    id: 'go',
    name: 'Go',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/go/go-original.svg',
    clients: [
      { id: 'net-http', name: 'net/http' },
      { id: 'resty', name: 'Resty' },
    ],
  },
  {
    id: 'java',
    name: 'Java',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/java/java-original.svg',
    clients: [
      { id: 'httpclient', name: 'HttpClient (Java 11+)' },
      { id: 'okhttp', name: 'OkHttp' },
    ],
  },
  {
    id: 'csharp',
    name: 'C#',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/csharp/csharp-original.svg',
    clients: [
      { id: 'httpclient', name: 'HttpClient' },
      { id: 'restsharp', name: 'RestSharp' },
    ],
  },
  {
    id: 'php',
    name: 'PHP',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/php/php-original.svg',
    clients: [
      { id: 'curl', name: 'cURL' },
      { id: 'guzzle', name: 'Guzzle' },
    ],
  },
  {
    id: 'rust',
    name: 'Rust',
    monochrome: true,
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/rust/rust-original.svg',
    clients: [
      { id: 'reqwest', name: 'Reqwest' },
      { id: 'ureq', name: 'ureq' },
    ],
  },
  {
    id: 'ruby',
    name: 'Ruby',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/ruby/ruby-original.svg',
    clients: [
      { id: 'net-http', name: 'Net::HTTP' },
      { id: 'faraday', name: 'Faraday' },
    ],
  },
  {
    id: 'kotlin',
    name: 'Kotlin',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/kotlin/kotlin-original.svg',
    clients: [
      { id: 'okhttp', name: 'OkHttp' },
      { id: 'ktor', name: 'Ktor Client' },
    ],
  },
  {
    id: 'swift',
    name: 'Swift',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/swift/swift-original.svg',
    clients: [
      { id: 'urlsession', name: 'URLSession' },
      { id: 'alamofire', name: 'Alamofire' },
    ],
  },
  {
    id: 'dart',
    name: 'Dart',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/dart/dart-original.svg',
    clients: [
      { id: 'http', name: 'http' },
      { id: 'dio', name: 'Dio' },
    ],
  },
  {
    id: 'cpp',
    name: 'C++',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/cplusplus/cplusplus-original.svg',
    clients: [
      { id: 'libcurl', name: 'libcurl' },
    ],
  },
  {
    id: 'curl',
    name: 'cURL',
    monochrome: true,
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/bash/bash-original.svg',
    clients: [
      { id: 'curl', name: 'cURL' },
    ],
  },
];

const METHOD_WITH_BODY = ['POST', 'PUT', 'PATCH', 'DELETE'];

function hasBody(method, body) {
  return METHOD_WITH_BODY.includes(method.toUpperCase()) && body !== undefined && body !== null && String(body).trim() !== '';
}

export function processRequestData(requestData = {}) {
  const {
    url = '',
    method = 'GET',
    headers = [],
    query = [],
    body = '',
    contentType = 'application/json',
  } = requestData;

  const validQueries = (Array.isArray(query) ? query : []).filter(
    q => q?.key && q.key.trim() !== ''
  );

  const validHeaders = (Array.isArray(headers) ? headers : []).filter(
    h => h?.key && h.key.trim() !== ''
  );

  // Automatically inject Content-Type if a body is present and not explicitly defined
  const hasMethodBody = hasBody(method, body);
  const hasContentTypeHeader = validHeaders.some(h => h.key.toLowerCase() === 'content-type');
  let finalHeaders = [...validHeaders];

  if (hasMethodBody && contentType && !hasContentTypeHeader) {
    finalHeaders.push({ key: 'Content-Type', value: contentType });
  }

  let fullUrl = url;

  if (validQueries.length && url) {
    try {
      const urlObj = new URL(url);
      validQueries.forEach(q => {
        urlObj.searchParams.append(q.key, q.value ?? '');
      });
      fullUrl = urlObj.toString();
    } catch {
      const qs = validQueries
        .map(
          q =>
            `${encodeURIComponent(q.key)}=${encodeURIComponent(q.value ?? '')}`
        )
        .join('&');

      fullUrl = url.includes('?') ? `${url}&${qs}` : `${url}?${qs}`;
    }
  }

  return {
    url,
    fullUrl,
    method: method.toUpperCase(),
    headers: finalHeaders,
    body: body ?? '',
    contentType: contentType || 'application/json',
  };
}

function tryParseJSON(body) {
  if (typeof body === 'object' && body !== null) return body;
  if (!body || !String(body).trim()) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
}

function jsString(value) {
  return JSON.stringify(String(value ?? ''));
}

function jsonObjectOrString(body) {
  const parsed = tryParseJSON(body);
  if (parsed !== null) {
    return JSON.stringify(parsed);
  }
  return jsString(body);
}

function pythonString(value) {
  return JSON.stringify(String(value ?? ''));
}

function pythonDict(headers) {
  if (!headers.length) return '{}';
  return `{
${headers
  .map(h => `    ${JSON.stringify(h.key)}: ${JSON.stringify(String(h.value ?? ''))}`)
  .join(',\n')}
}`;
}

function goString(value) { return JSON.stringify(String(value ?? '')); }
function javaString(value) { return JSON.stringify(String(value ?? '')); }
function csharpString(value) { return JSON.stringify(String(value ?? '')); }
function phpSingleQuote(value) { return String(value ?? '').replace(/\\/g, '\\\\').replace(/'/g, "\\'"); }
function rubyString(value) { return JSON.stringify(String(value ?? '')); }
function swiftString(value) { return JSON.stringify(String(value ?? '')); }
function dartString(value) { return JSON.stringify(String(value ?? '')); }
function rustString(value) { return JSON.stringify(String(value ?? '')); }

function getContentType(headers) {
  return (
    headers.find(h => h.key.toLowerCase() === 'content-type')?.value ||
    'application/json'
  );
}

function generateJavaScriptFetch(request) {
  const { fullUrl, method, headers, body, contentType } = request;
  const headerEntries = headers.length
    ? `\n  headers: ${JSON.stringify(
        Object.fromEntries(headers.map(h => [h.key, h.value])),
        null,
        2
      )},`
    : '';
    
  let bodyPart = '';
  if (hasBody(method, body)) {
    if (contentType === 'application/json') {
      const parsed = tryParseJSON(body);
      if (parsed !== null) {
        bodyPart = `\n  body: JSON.stringify(${JSON.stringify(parsed)}),`;
      } else {
        bodyPart = `\n  body: JSON.stringify(${jsString(body)}),`;
      }
    } else {
      bodyPart = `\n  body: ${jsString(body)},`;
    }
  }

  return `const response = await fetch(${jsString(fullUrl)}, {
  method: ${jsString(method)},${headerEntries}${bodyPart}
});

const data = await response.text();
console.log(data);`;
}

function generateJavaScriptAxios(request) {
  const { fullUrl, method, headers, body, contentType } = request;
  const config = [];
  config.push(`  method: ${jsString(method)}`);
  config.push(`  url: ${jsString(fullUrl)}`);

  if (headers.length) {
    config.push(
      `  headers: ${JSON.stringify(
        Object.fromEntries(headers.map(h => [h.key, h.value])),
        null,
        2
      )}`
    );
  }
  if (hasBody(method, body)) {
    if (contentType === 'application/json') {
      const parsed = tryParseJSON(body);
      if (parsed !== null) {
        config.push(`  data: ${JSON.stringify(parsed, null, 2)}`);
      } else {
        config.push(`  data: ${jsString(body)}`);
      }
    } else {
      config.push(`  data: ${jsString(body)}`);
    }
  }

  return `import axios from 'axios';

const response = await axios({
${config.join(',\n')}
});

console.log(response.data);`;
}

function generateJavaScriptXHR(request) {
  const { fullUrl, method, headers, body, contentType } = request;
  let code = `const xhr = new XMLHttpRequest();

xhr.open(${jsString(method)}, ${jsString(fullUrl)});`;

  headers.forEach(h => {
    code += `\nxhr.setRequestHeader(${jsString(h.key)}, ${jsString(h.value)});`;
  });

  code += `

xhr.onload = () => {
  console.log(xhr.responseText);
};

xhr.onerror = () => {
  console.error('Request failed');
};`;

  if (hasBody(method, body)) {
    if (contentType === 'application/json') {
      const parsed = tryParseJSON(body);
      const payloadStr = parsed !== null ? JSON.stringify(parsed) : jsString(body);
      code += `

xhr.send(JSON.stringify(${payloadStr}));`;
    } else {
      code += `

xhr.send(${jsString(body)});`;
    }
  } else {
    code += `

xhr.send();`;
  }
  return code;
}

function generatePythonRequests(request) {
  const { fullUrl, method, headers, body, contentType } = request;
  let code = `import requests

url = ${pythonString(fullUrl)}

headers = ${pythonDict(headers)}
`;

  if (hasBody(method, body)) {
    const parsed = tryParseJSON(body);
    if (contentType === 'application/json' && parsed !== null) {
      code += `\npayload = ${JSON.stringify(parsed, null, 4)}

response = requests.request(
    ${JSON.stringify(method)},
    url,
    headers=headers,
    json=payload
)`;
    } else {
      code += `\npayload = ${pythonString(typeof body === 'object' ? JSON.stringify(body) : body)}

response = requests.request(
    ${JSON.stringify(method)},
    url,
    headers=headers,
    data=payload
)`;
    }
  } else {
    code += `\nresponse = requests.request(
    ${JSON.stringify(method)},
    url,
    headers=headers
)`;
  }
  code += `

print(response.text)`;
  return code;
}

function generatePythonHTTPX(request) {
  const { fullUrl, method, headers, body, contentType } = request;
  let code = `import httpx

url = ${pythonString(fullUrl)}

headers = ${pythonDict(headers)}
`;

  if (hasBody(method, body)) {
    const parsed = tryParseJSON(body);
    if (contentType === 'application/json' && parsed !== null) {
      code += `\npayload = ${JSON.stringify(parsed, null, 4)}

response = httpx.request(
    ${JSON.stringify(method)},
    url,
    headers=headers,
    json=payload
)`;
    } else {
      code += `\npayload = ${pythonString(typeof body === 'object' ? JSON.stringify(body) : body)}

response = httpx.request(
    ${JSON.stringify(method)},
    url,
    headers=headers,
    content=payload
)`;
    }
  } else {
    code += `\nresponse = httpx.request(
    ${JSON.stringify(method)},
    url,
    headers=headers
)`;
  }
  code += `

print(response.text)`;
  return code;
}

function generatePythonAiohttp(request) {
  const { fullUrl, method, headers, body, contentType } = request;
  let code = `import asyncio
import aiohttp

async def main():
    headers = ${pythonDict(headers)}
`;

  if (hasBody(method, body)) {
    const parsed = tryParseJSON(body);
    if (contentType === 'application/json' && parsed !== null) {
      code += `    payload = ${JSON.stringify(parsed, null, 8)}

    async with aiohttp.ClientSession() as session:
        async with session.request(
            ${JSON.stringify(method)},
            ${pythonString(fullUrl)},
            headers=headers,
            json=payload
        ) as response:
            print(await response.text())`;
    } else {
      code += `    payload = ${pythonString(typeof body === 'object' ? JSON.stringify(body) : body)}

    async with aiohttp.ClientSession() as session:
        async with session.request(
            ${JSON.stringify(method)},
            ${pythonString(fullUrl)},
            headers=headers,
            data=payload
        ) as response:
            print(await response.text())`;
    }
  } else {
    code += `    async with aiohttp.ClientSession() as session:
        async with session.request(
            ${JSON.stringify(method)},
            ${pythonString(fullUrl)},
            headers=headers
        ) as response:
            print(await response.text())`;
  }
  code += `

asyncio.run(main())`;
  return code;
}

function generatePythonUrllib(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `import urllib.request

url = ${pythonString(fullUrl)}

headers = ${pythonDict(headers)}
`;

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `
data = ${JSON.stringify(resolvedBody)}.encode('utf-8')

request = urllib.request.Request(
    url,
    data=data,
    headers=headers,
    method=${JSON.stringify(method)}
)`;
  } else {
    code += `
request = urllib.request.Request(
    url,
    headers=headers,
    method=${JSON.stringify(method)}
)`;
  }
  code += `

with urllib.request.urlopen(request) as response:
    print(response.read().decode('utf-8'))`;
  return code;
}

function generateGoNetHTTP(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `package main

import (
    "fmt"
    "io"
    "net/http"
    "strings"
)

func main() {
`;

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `    payload := strings.NewReader(${goString(resolvedBody)})
    req, err := http.NewRequest(${goString(method)}, ${goString(fullUrl)}, payload)
`;
  } else {
    code += `    req, err := http.NewRequest(${goString(method)}, ${goString(fullUrl)}, nil)
`;
  }

  code += `
    if err != nil {
        panic(err)
    }
`;

  headers.forEach(h => {
    code += `    req.Header.Set(${goString(h.key)}, ${goString(h.value)})\n`;
  });

  code += `
    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        panic(err)
    }
    defer resp.Body.Close()

    responseBody, err := io.ReadAll(resp.Body)
    if err != nil {
        panic(err)
    }

    fmt.Println(string(responseBody))
}`;
  return code;
}

function generateGoResty(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `package main

import (
    "fmt"
    "github.com/go-resty/resty/v2"
)

func main() {
    client := resty.New()
    request := client.R()
`;

  headers.forEach(h => {
    code += `    request.SetHeader(${goString(h.key)}, ${goString(h.value)})\n`;
  });

  if (hasBody(method, body)) {
    const parsed = tryParseJSON(body);
    if (parsed !== null) {
      code += `    request.SetBody(${JSON.stringify(parsed, null, 4)})\n`;
    } else {
      code += `    request.SetBody(${goString(body)})\n`;
    }
  }

  code += `
    response, err := request.Execute(
        ${goString(method)},
        ${goString(fullUrl)},
    )

    if err != nil {
        panic(err)
    }

    fmt.Println(response.String())
}`;
  return code;
}

function generateJavaHttpClient(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;

public class Main {
    public static void main(String[] args) throws Exception {
        HttpClient client = HttpClient.newHttpClient();

        HttpRequest.Builder builder = HttpRequest.newBuilder()
            .uri(URI.create(${javaString(fullUrl)}))
`;

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `            .method(${javaString(method)}, HttpRequest.BodyPublishers.ofString(${javaString(resolvedBody)}))\n`;
  } else {
    code += `            .method(${javaString(method)}, HttpRequest.BodyPublishers.noBody())\n`;
  }

  headers.forEach(h => {
    code += `            .header(${javaString(h.key)}, ${javaString(h.value)})\n`;
  });

  code += `;

        HttpRequest request = builder.build();
        HttpResponse<String> response = client.send(
            request,
            HttpResponse.BodyHandlers.ofString()
        );

        System.out.println(response.body());
    }
}`;
  return code;
}

function generateJavaOkHttp(request) {
  const { fullUrl, method, headers, body } = request;
  const contentType = getContentType(headers);
  let code = `import okhttp3.*;

public class Main {
    public static void main(String[] args) throws Exception {
        OkHttpClient client = new OkHttpClient();
`;

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `
        MediaType mediaType = MediaType.parse(${javaString(contentType)});
        RequestBody requestBody = RequestBody.create(
            ${javaString(resolvedBody)},
            mediaType
        );
`;
  }

  code += `
        Request.Builder builder = new Request.Builder()
            .url(${javaString(fullUrl)});
`;

  headers.forEach(h => {
    code += `        builder.addHeader(${javaString(h.key)}, ${javaString(h.value)});
`;
  });

  if (hasBody(method, body)) {
    code += `
        Request request = builder
            .method(${javaString(method)}, requestBody)
            .build();
`;
  } else {
    code += `
        Request request = builder
            .method(${javaString(method)}, null)
            .build();
`;
  }

  code += `
        try (Response response = client.newCall(request).execute()) {
            System.out.println(response.body().string());
        }
    }
}`;
  return code;
}

function generateCSharpHttpClient(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `using System.Net.Http;
using System.Threading.Tasks;

class Program
{
    static async Task Main()
    {
        using var client = new HttpClient();
        var request = new HttpRequestMessage(
            HttpMethod.${method.charAt(0) + method.slice(1).toLowerCase()},
            ${csharpString(fullUrl)}
        );
`;

  headers.forEach(h => {
    code += `        request.Headers.TryAddWithoutValidation(${csharpString(h.key)}, ${csharpString(h.value)});\n`;
  });

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `        request.Content = new StringContent(${csharpString(resolvedBody)});\n`;
  }

  code += `
        var response = await client.SendAsync(request);
        var result = await response.Content.ReadAsStringAsync();

        System.Console.WriteLine(result);
    }
}`;
  return code;
}

function generateCSharpRestSharp(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `using RestSharp;

var options = new RestClientOptions(${csharpString(fullUrl)});
var client = new RestClient(options);
var request = new RestRequest("", Method.${method.charAt(0) + method.slice(1).toLowerCase()});
`;

  headers.forEach(h => {
    code += `request.AddHeader(${csharpString(h.key)}, ${csharpString(h.value)});\n`;
  });

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `request.AddStringBody(${csharpString(resolvedBody)}, ContentType.Json);\n`;
  }

  code += `
var response = await client.ExecuteAsync(request);
Console.WriteLine(response.Content);`;
  return code;
}

function generatePhpCurl(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `<?php

$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => '${phpSingleQuote(fullUrl)}',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_CUSTOMREQUEST => '${phpSingleQuote(method)}',
`;

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `    CURLOPT_POSTFIELDS => '${phpSingleQuote(resolvedBody)}',\n`;
  }

  if (headers.length) {
    code += `    CURLOPT_HTTPHEADER => [\n`;
    headers.forEach(h => {
      code += `        '${phpSingleQuote(`${h.key}: ${h.value}`)}',\n`;
    });
    code += `    ],\n`;
  }

  code += `]);

$response = curl_exec($curl);
curl_close($curl);
echo $response;`;
  return code;
}

function generatePhpGuzzle(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `<?php

require 'vendor/autoload.php';

use GuzzleHttp\\Client;

$client = new Client();
$response = $client->request('${phpSingleQuote(method)}', '${phpSingleQuote(fullUrl)}', [
`;

  if (headers.length) {
    code += `    'headers' => [\n`;
    headers.forEach(h => {
      code += `        '${phpSingleQuote(h.key)}' => '${phpSingleQuote(h.value)}',\n`;
    });
    code += `    ],\n`;
  }

  if (hasBody(method, body)) {
    const parsed = tryParseJSON(body);
    if (parsed !== null) {
      code += `    'json' => ${JSON.stringify(parsed, null, 4)},\n`;
    } else {
      code += `    'body' => '${phpSingleQuote(body)}',\n`;
    }
  }

  code += `]);

echo $response->getBody();`;
  return code;
}

function generateRustReqwest(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `use reqwest::blocking::Client;

fn main() -> Result<(), Box<dyn std::error::Error>> {
    let client = Client::new();
    let mut request = client
        .request(reqwest::Method::${method}, ${rustString(fullUrl)})
`;

  headers.forEach(h => {
    code += `        .header(${rustString(h.key)}, ${rustString(h.value)})\n`;
  });

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `        .body(${rustString(resolvedBody)})\n`;
  }

  code += `        .send()?;

    println!("{}", request.text()?);
    Ok(())
}`;
  return code;
}

function generateRustUreq(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `fn main() {
    let request = ureq::request(${rustString(method)}, ${rustString(fullUrl)})
`;

  headers.forEach(h => {
    code += `        .set(${rustString(h.key)}, ${rustString(h.value)})\n`;
  });

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `        .send_string(${rustString(resolvedBody)})\n`;
  } else {
    code += `        .call()\n`;
  }

  code += `;

    match request {
        Ok(response) => {
            println!("{}", response.into_string().unwrap());
        }
        Err(error) => {
            eprintln!("{}", error);
        }
    }
}`;
  return code;
}

function generateRubyNetHTTP(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `require 'net/http'
require 'uri'

uri = URI.parse(${rubyString(fullUrl)})
http = Net::HTTP.new(uri.host, uri.port)
request = Net::HTTP::${method === 'GET' ? 'Get' : method === 'POST' ? 'Post' : method === 'PUT' ? 'Put' : method === 'PATCH' ? 'Patch' : 'Delete'}.new(uri)
`;

  headers.forEach(h => {
    code += `request[${rubyString(h.key)}] = ${rubyString(h.value)}\n`;
  });

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `request.body = ${rubyString(resolvedBody)}\n`;
  }

  code += `
response = http.request(request)
puts response.body`;
  return code;
}

function generateRubyFaraday(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `require 'faraday'

conn = Faraday.new(url: ${rubyString(fullUrl)}) do |f|
`;

  headers.forEach(h => {
    code += `  f.headers[${rubyString(h.key)}] = ${rubyString(h.value)}\n`;
  });

  code += `end

response = conn.${method.toLowerCase()}`;

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += ` do |req|
    req.body = ${rubyString(resolvedBody)}
  end`;
  }

  code += `

puts response.body`;
  return code;
}

function generateKotlinOkHttp(request) {
  const { fullUrl, method, headers, body } = request;
  const contentType = getContentType(headers);
  let code = `import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody

val client = OkHttpClient()

`;

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `val mediaType = ${javaString(contentType)}.toMediaType()
val body = ${javaString(resolvedBody)}.toRequestBody(mediaType)

`;
  }

  code += `val request = Request.Builder()
    .url(${javaString(fullUrl)})
`;

  headers.forEach(h => {
    code += `    .addHeader(${javaString(h.key)}, ${javaString(h.value)})\n`;
  });

  code += `    .method(${javaString(method)}, ${hasBody(method, body) ? 'body' : 'null'})
    .build()

val response = client.newCall(request).execute()
println(response.body?.string())`;
  return code;
}

function generateKotlinKtor(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `import io.ktor.client.*
import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import kotlinx.coroutines.runBlocking

val client = HttpClient()

fun main() = runBlocking {
    val response: HttpResponse = client.request(${javaString(fullUrl)}) {
        method = HttpMethod.${method.charAt(0) + method.slice(1).toLowerCase()}
`;

  headers.forEach(h => {
    code += `        header(${javaString(h.key)}, ${javaString(h.value)})\n`;
  });

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `        setBody(${javaString(resolvedBody)})\n`;
  }

  code += `    }

    println(response.bodyAsText())
    client.close()
}`;
  return code;
}

function generateSwiftURLSession(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `import Foundation

var request = URLRequest(
    url: URL(string: ${swiftString(fullUrl)})!
)
request.httpMethod = ${swiftString(method)}
`;

  headers.forEach(h => {
    code += `request.setValue(${swiftString(h.value)}, forHTTPHeaderField: ${swiftString(h.key)})\n`;
  });

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `request.httpBody = ${swiftString(resolvedBody)}.data(using: .utf8)\n`;
  }

  code += `
let task = URLSession.shared.dataTask(with: request) { data, response, error in
    if let error = error {
        print(error)
        return
    }
    if let data = data {
        print(String(data: data, encoding: .utf8) ?? "")
    }
}

task.resume()`;
  return code;
}

function generateSwiftAlamofire(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `import Alamofire

var headers: HTTPHeaders = [
`;

  headers.forEach((h, index) => {
    code += `    ${swiftString(h.key)}: ${swiftString(h.value)}${index < headers.length - 1 ? ',' : ''}\n`;
  });

  code += `]

`;

  if (hasBody(method, body)) {
    const parsed = tryParseJSON(body);
    code += `AF.request(
    ${swiftString(fullUrl)},
    method: .${method.toLowerCase()},
    headers: headers,
    parameters: ${parsed !== null ? JSON.stringify(parsed, null, 4) : 'nil'},
    encoding: JSONEncoding.default
)
.responseString { response in
    print(response.value ?? "")
}`;
  } else {
    code += `AF.request(
    ${swiftString(fullUrl)},
    method: .${method.toLowerCase()},
    headers: headers
)
.responseString { response in
    print(response.value ?? "")
}`;
  }
  return code;
}

function generateDartHttp(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `import 'package:http/http.dart' as http;

final url = Uri.parse(${dartString(fullUrl)});

final response = await http.${method.toLowerCase()}(
  url,
`;

  if (headers.length) {
    code += `  headers: {
${headers
  .map(h => `    ${dartString(h.key)}: ${dartString(h.value)}`)
  .join(',\n')}
  },
`;
  }

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `  body: ${dartString(resolvedBody)},\n`;
  }

  code += `);

print(response.body);`;
  return code;
}

function generateDartDio(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `import 'package:dio/dio.dart';

final dio = Dio();
final response = await dio.request(
  ${dartString(fullUrl)},
  options: Options(
    method: ${dartString(method)},
`;

  if (headers.length) {
    code += `    headers: {
${headers
  .map(h => `      ${dartString(h.key)}: ${dartString(h.value)}`)
  .join(',\n')}
    },
`;
  }

  code += `  },\n`;

  if (hasBody(method, body)) {
    const parsed = tryParseJSON(body);
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `  data: ${
      parsed !== null
        ? JSON.stringify(parsed, null, 4)
        : dartString(resolvedBody)
    },\n`;
  }

  code += `);

print(response.data);`;
  return code;
}

function generateCppLibcurl(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `#include <curl/curl.h>
#include <iostream>

int main() {
    CURL* curl = curl_easy_init();
    if (!curl) {
        return 1;
    }

    curl_easy_setopt(curl, CURLOPT_URL, ${JSON.stringify(fullUrl)});
    curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, ${JSON.stringify(method)});
`;

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += `    curl_easy_setopt(curl, CURLOPT_POSTFIELDS, ${JSON.stringify(resolvedBody)});\n`;
  }

  if (headers.length) {
    code += `\n    struct curl_slist* headers = nullptr;\n`;
    headers.forEach(h => {
      code += `    headers = curl_slist_append(headers, ${JSON.stringify(`${h.key}: ${h.value}`)});\n`;
    });
    code += `    curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);\n`;
  }

  code += `
    CURLcode result = curl_easy_perform(curl);
    if (result != CURLE_OK) {
        std::cerr << curl_easy_strerror(result) << std::endl;
    }

    curl_easy_cleanup(curl);
    return 0;
}`;
  return code;
}

function generateCurl(request) {
  const { fullUrl, method, headers, body } = request;
  let code = `curl --request ${method} \\
  --url '${phpSingleQuote(fullUrl)}'`;

  headers.forEach(h => {
    code += ` \\\n  --header '${phpSingleQuote(`${h.key}: ${h.value}`)}'`;
  });

  if (hasBody(method, body)) {
    const resolvedBody = typeof body === 'object' ? JSON.stringify(body) : String(body);
    code += ` \\\n  --data '${phpSingleQuote(resolvedBody)}'`;
  }

  return code;
}
function generateTypeScriptFetch(request) {
  return generateJavaScriptFetch(request);
}

function generateTypeScriptAxios(request) {
  return generateJavaScriptAxios(request);
}

const GENERATORS = {
  javascript: {
    fetch: generateJavaScriptFetch,
    axios: generateJavaScriptAxios,
    xhr: generateJavaScriptXHR,
  },
  typescript: {
    fetch: generateTypeScriptFetch,
    axios: generateTypeScriptAxios,
  },
  python: {
    requests: generatePythonRequests,
    httpx: generatePythonHTTPX,
    aiohttp: generatePythonAiohttp,
    urllib: generatePythonUrllib,
  },
  go: {
    'net-http': generateGoNetHTTP,
    resty: generateGoResty,
  },
  java: {
    httpclient: generateJavaHttpClient,
    okhttp: generateJavaOkHttp,
  },
  csharp: {
    httpclient: generateCSharpHttpClient,
    restsharp: generateCSharpRestSharp,
  },
  php: {
    curl: generatePhpCurl,
    guzzle: generatePhpGuzzle,
  },
  rust: {
    reqwest: generateRustReqwest,
    ureq: generateRustUreq,
  },
  ruby: {
    'net-http': generateRubyNetHTTP,
    faraday: generateRubyFaraday,
  },
  kotlin: {
    okhttp: generateKotlinOkHttp,
    ktor: generateKotlinKtor,
  },
  swift: {
    urlsession: generateSwiftURLSession,
    alamofire: generateSwiftAlamofire,
  },
  dart: {
    http: generateDartHttp,
    dio: generateDartDio,
  },
  cpp: {
    libcurl: generateCppLibcurl,
  },
  curl: {
    curl: generateCurl,
  },
};

export function generateCodeSnippet(languageId, clientId, requestData) {
  const processedData = processRequestData(requestData);
  const generator = GENERATORS[languageId]?.[clientId];
  
  if (typeof generator !== 'function') {
    return '// Snippet generator not available for this combination';
  }
  
  try {
    return generator(processedData);
  } catch (err) {
    return `// Error generating snippet: ${err.message}`;
  }
}