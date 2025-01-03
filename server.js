const app = require("./src/app.js");
const http = require("http");

const port = 8080;
const host = '127.0.0.1';
const server = http.createServer(app);

server.listen(port, host, () => {
    console.log(`Server is running on ${port} port...`);
    console.log(process.version);
});