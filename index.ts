import http = require("http");

const server = http.createServer((req, res) => {
  res.writeHead(200, { "Content-type": "text/plain" });
  res.end("Hello, world!");
});

server.listen(8001, "localhost", () => {
  console.log("Listening to requests on port 8001");
});
