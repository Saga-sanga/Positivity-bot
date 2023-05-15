// const express = require("express");
import express from "express";
const server = express();
const port = 3000;

server.all("/", (req, res) => {
  console.log("Bot is running!");
});

function keepAlive() {
  server.listen(port, () => {
    console.log("Server is ready!");
  });
}

export default keepAlive;
